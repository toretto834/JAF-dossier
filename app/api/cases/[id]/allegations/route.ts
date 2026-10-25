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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const { user } = await requireCaseAccess(id);
    const input = schema.parse(await request.json());
    const count = await db.allegation.count({ where: { caseId: id } });
    const item = await db.allegation.create({ data: { caseId: id, reference: `A${String(count + 1).padStart(3, "0")}`, ...input, response: input.response || null, verificationPoint: input.verificationPoint || null } });
    await db.auditLog.create({ data: { userId: user.id, caseId: id, action: "CREATE", entityType: "ALLEGATION", entityId: item.id } });
    return NextResponse.json(item, { status: 201 });
  } catch (error) { return apiError(error); }
}
