import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCaseAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, assertSameOrigin } from "@/lib/http";

const schema = z.object({
  theme: z.string().trim().min(2).max(100), allegation: z.string().trim().min(5).max(5000), source: z.string().trim().min(2).max(500),
  response: z.string().trim().max(5000).optional(), verificationPoint: z.string().trim().max(2000).optional(),
  unfavorableToUser: z.boolean().default(false), contested: z.boolean().default(false),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; allegationId: string }> }) {
  try {
    assertSameOrigin(request);
    const { id, allegationId } = await params;
    const { user } = await requireCaseAccess(id);
    const existing = await db.allegation.findFirst({ where: { id: allegationId, caseId: id }, select: { id: true } });
    if (!existing) throw new Error("NOT_FOUND");
    const input = schema.parse(await request.json());
    const item = await db.allegation.update({
      where: { id: allegationId },
      data: { ...input, response: input.response || null, verificationPoint: input.verificationPoint || null },
    });
    await db.auditLog.create({ data: { userId: user.id, caseId: id, action: "UPDATE", entityType: "ALLEGATION", entityId: item.id } });
    return NextResponse.json(item);
  } catch (error) { return apiError(error); }
}
