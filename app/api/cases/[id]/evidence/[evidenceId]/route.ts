import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCaseAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, assertSameOrigin } from "@/lib/http";
import { readOriginal, safeDownloadName } from "@/lib/storage";

const updateSchema = z.object({
  source: z.string().trim().min(2).max(500),
  category: z.string().trim().min(2).max(100),
  documentDate: z.string().max(10).optional(),
  confidentiality: z.enum(["STANDARD", "SENSITIVE", "HIGHLY_SENSITIVE"]),
  notes: z.string().trim().max(3000).optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string; evidenceId: string }> }) {
  try {
    const { id, evidenceId } = await params;
    const { user } = await requireCaseAccess(id);
    const evidence = await db.evidence.findFirst({ where: { id: evidenceId, caseId: id } });
    if (!evidence) throw new Error("NOT_FOUND");
    const file = await readOriginal(evidence.relativePath);
    await db.auditLog.create({ data: { userId: user.id, caseId: id, action: "DOWNLOAD", entityType: "EVIDENCE", entityId: evidence.id } });
    return new NextResponse(file, { headers: { "Content-Type": evidence.mimeType, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(safeDownloadName(evidence.originalName))}`, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; evidenceId: string }> }) {
  try {
    assertSameOrigin(request);
    const { id, evidenceId } = await params;
    const { user } = await requireCaseAccess(id);
    const existing = await db.evidence.findFirst({ where: { id: evidenceId, caseId: id }, select: { id: true } });
    if (!existing) throw new Error("NOT_FOUND");
    const input = updateSchema.parse(await request.json());
    const evidence = await db.evidence.update({
      where: { id: evidenceId },
      data: {
        source: input.source,
        category: input.category,
        documentDate: input.documentDate ? new Date(`${input.documentDate}T12:00:00`) : null,
        confidentiality: input.confidentiality,
        notes: input.notes || null,
      },
    });
    await db.auditLog.create({ data: { userId: user.id, caseId: id, action: "UPDATE", entityType: "EVIDENCE", entityId: evidence.id } });
    return NextResponse.json(evidence);
  } catch (error) { return apiError(error); }
}
