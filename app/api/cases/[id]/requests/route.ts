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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const { user } = await requireCaseAccess(id);
    const input = schema.parse(await request.json());
    const [events, evidence] = await Promise.all([
      db.event.findMany({ where: { id: { in: input.eventIds }, caseId: id }, select: { id: true } }),
      db.evidence.findMany({ where: { id: { in: input.evidenceIds }, caseId: id }, select: { id: true } }),
    ]);
    const legalRequest = await db.legalRequest.create({ data: {
      caseId: id, title: input.title, objective: input.objective, currentSituation: input.currentSituation || null,
      difficulty: input.difficulty || null, requestedChange: input.requestedChange || null, childImpact: input.childImpact || null,
      alternatives: input.alternatives || null, lawyerArbitration: input.lawyerArbitration || null,
      eventLinks: { create: events.map((e) => ({ eventId: e.id })) }, evidenceLinks: { create: evidence.map((e) => ({ evidenceId: e.id })) },
    }});
    await db.auditLog.create({ data: { userId: user.id, caseId: id, action: "CREATE", entityType: "LEGAL_REQUEST", entityId: legalRequest.id } });
    return NextResponse.json(legalRequest, { status: 201 });
  } catch (error) { return apiError(error); }
}
