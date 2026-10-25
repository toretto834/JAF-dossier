import { NextResponse } from "next/server";
import { requireCaseAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireCaseAccess(id);
    const familyCase = await db.familyCase.findUniqueOrThrow({
      where: { id },
      include: {
        children: true, procedures: true,
        events: { orderBy: { occurredAt: "desc" }, include: { evidenceLinks: { include: { evidence: true } }, requestLinks: true } },
        evidence: { orderBy: { createdAt: "desc" }, include: { eventLinks: true, requestLinks: true, allegationLinks: true } },
        allegations: { orderBy: { createdAt: "desc" }, include: { eventLinks: true, evidenceLinks: true } },
        requests: { orderBy: { createdAt: "desc" }, include: { eventLinks: { include: { event: true } }, evidenceLinks: { include: { evidence: true } } } },
        qualityAlerts: { where: { resolvedAt: null }, orderBy: [{ severity: "desc" }, { createdAt: "desc" }] },
        exports: { orderBy: { versionNumber: "desc" }, take: 10 },
      },
    });
    return NextResponse.json(familyCase);
  } catch (error) { return apiError(error); }
}
