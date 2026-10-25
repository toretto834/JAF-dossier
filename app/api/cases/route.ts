import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { apiError, assertSameOrigin } from "@/lib/http";

const createSchema = z.object({
  reference: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/),
  title: z.string().trim().min(2).max(120),
  parentIdentity: z.string().trim().min(2).max(160),
  otherParentIdentity: z.string().trim().max(160).optional(),
  childFirstName: z.string().trim().max(80).optional(),
  childBirthDate: z.string().optional(),
  court: z.string().trim().max(160).optional(),
  nextHearingAt: z.string().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const cases = await db.familyCase.findMany({ where: { ownerId: user.id, archivedAt: null }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { events: true, evidence: true, requests: true, qualityAlerts: true } } } });
    return NextResponse.json(cases);
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = createSchema.parse(await request.json());
    const familyCase = await db.familyCase.create({
      data: {
        ownerId: user.id, reference: input.reference.toUpperCase(), title: input.title, parentIdentity: input.parentIdentity,
        otherParentIdentity: input.otherParentIdentity || null, court: input.court || null,
        nextHearingAt: input.nextHearingAt ? new Date(input.nextHearingAt) : null,
        children: input.childFirstName ? { create: { firstName: input.childFirstName, birthDate: input.childBirthDate ? new Date(input.childBirthDate) : null } } : undefined,
      },
    });
    await db.auditLog.create({ data: { userId: user.id, caseId: familyCase.id, action: "CREATE", entityType: "CASE", entityId: familyCase.id } });
    return NextResponse.json(familyCase, { status: 201 });
  } catch (error) { return apiError(error); }
}
