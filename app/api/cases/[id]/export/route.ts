import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { requireCaseAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, assertSameOrigin } from "@/lib/http";
import { buildLawyerZip } from "@/lib/exporter";
import { persistExport } from "@/lib/storage";

export const maxDuration = 60;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const { user, familyCase } = await requireCaseAccess(id);
    const workspace = await db.familyCase.findUniqueOrThrow({ where: { id }, include: {
      children: true, procedures: true, events: { orderBy: { occurredAt: "asc" }, include: { evidenceLinks: { include: { evidence: true } } } },
      evidence: { orderBy: { pieceReference: "asc" } }, allegations: { orderBy: { reference: "asc" } },
      requests: { include: { eventLinks: true, evidenceLinks: true } }, qualityAlerts: { where: { resolvedAt: null } },
    }});
    const latest = await db.exportVersion.aggregate({ where: { caseId: id }, _max: { versionNumber: true } });
    const version = (latest._max.versionNumber || 0) + 1;
    const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const fileName = `DOSSIER_AVOCAT_${familyCase.reference}_${date}_V${version}.zip`;
    const result = await buildLawyerZip(workspace);
    const relativePath = path.join(id, fileName);
    await persistExport(relativePath, result.buffer);
    const record = await db.exportVersion.create({ data: { caseId: id, versionNumber: version, fileName, relativePath, sha256: result.sha256, status: "READY", manifest: result.manifest } });
    await db.auditLog.create({ data: { userId: user.id, caseId: id, action: "EXPORT", entityType: "EXPORT", entityId: record.id, metadata: { version, evidenceCount: workspace.evidence.length } } });
    return new NextResponse(new Uint8Array(result.buffer), { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${fileName}"`, "X-Export-Sha256": result.sha256 } });
  } catch (error) { return apiError(error); }
}
