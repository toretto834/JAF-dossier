import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCaseAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, assertSameOrigin } from "@/lib/http";

const schema = z.object({
  occurredAt: z.string().min(1),
  type: z.string().trim().min(2).max(80),
  theme: z.string().trim().min(2).max(80),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(5).max(8000),
  sourceType: z.enum(["DIRECT", "REPORTED", "DOCUMENT", "INTERPRETATION", "UNVERIFIED"]),
  sourceDetails: z.string().trim().max(500).optional(),
  importance: z.number().int().min(1).max(3).default(1),
  needsVerification: z.boolean().default(false),
  unfavorable: z.boolean().default(false),
  evidenceIds: z.array(z.string()).max(30).default([]),
  requestIds: z.array(z.string()).max(30).default([]),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const { user } = await requireCaseAccess(id);
    const input = schema.parse(await request.json());
    const [validEvidence, validRequests] = await Promise.all([
      db.evidence.findMany({ where: { id: { in: input.evidenceIds }, caseId: id }, select: { id: true } }),
      db.legalRequest.findMany({ where: { id: { in: input.requestIds }, caseId: id }, select: { id: true } }),
    ]);
    const event = await db.event.create({ data: {
      caseId: id, createdById: user.id, occurredAt: new Date(input.occurredAt), type: input.type, theme: input.theme,
      title: input.title, description: input.description, sourceType: input.sourceType, sourceDetails: input.sourceDetails || null,
      importance: input.importance, needsVerification: input.needsVerification, unfavorable: input.unfavorable,
      validationStatus: input.needsVerification ? "TO_VERIFY" : "DRAFT",
      evidenceLinks: { create: validEvidence.map((item) => ({ evidenceId: item.id })) },
      requestLinks: { create: validRequests.map((item) => ({ requestId: item.id })) },
    }});
    await db.auditLog.create({ data: { userId: user.id, caseId: id, action: "CREATE", entityType: "EVENT", entityId: event.id } });
    return NextResponse.json(event, { status: 201 });
  } catch (error) { return apiError(error); }
}
