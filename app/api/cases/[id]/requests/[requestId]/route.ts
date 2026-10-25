import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCaseAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, assertSameOrigin } from "@/lib/http";

const schema = z.object({
  title: z.string().trim().min(2).max(160), objective: z.string().trim().min(5).max(3000),
  currentSituation: z.string().trim().max(3000).optional(), difficulty: z.string().trim().max(3000).optional(),
  requestedChange: z.string().trim().max(3000).optional(), childImpact: z.string().trim().max(3000).optional(),
  alternatives: z.string().trim().max(3000).optional(), lawyerArbitration: z.string().trim().max(3000).optional(),
  eventIds: z.array(z.string()).max(50).default([]), evidenceIds: z.array(z.string()).max(50).default([]),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; requestId: string }> }) {
  try {
    assertSameOrigin(request);
    const { id, requestId } = await params;
    const { user } = await requireCaseAccess(id);
    const existing = await db.legalRequest.findFirst({ where: { id: requestId, caseId: id }, select: { id: true } });
    if (!existing) throw new Error("NOT_FOUND");
    const input = schema.parse(await request.json());
    const [events, evidence] = await Promise.all([
      db.event.findMany({ where: { id: { in: input.eventIds }, caseId: id }, select: { id: true } }),
      db.evidence.findMany({ where: { id: { in: input.evidenceIds }, caseId: id }, select: { id: true } }),
    ]);
    const item = await db.$transaction(async (tx) => {
      await tx.requestEvent.deleteMany({ where: { requestId } });
      await tx.requestEvidence.deleteMany({ where: { requestId } });
      return tx.legalRequest.update({
        where: { id: requestId },
        data: {
          title: input.title, objective: input.objective, currentSituation: input.currentSituation || null,
          difficulty: input.difficulty || null, requestedChange: input.requestedChange || null,
          childImpact: input.childImpact || null, alternatives: input.alternatives || null,
          lawyerArbitration: input.lawyerArbitration || null,
          eventLinks: { create: events.map((event) => ({ eventId: event.id })) },
          evidenceLinks: { create: evidence.map((document) => ({ evidenceId: document.id })) },
        },
      });
    });
    await db.auditLog.create({ data: { userId: user.id, caseId: id, action: "UPDATE", entityType: "LEGAL_REQUEST", entityId: item.id } });
    return NextResponse.json(item);
  } catch (error) { return apiError(error); }
}
