import { NextRequest, NextResponse } from "next/server";
import { clearSession, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, assertSameOrigin } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (user) await db.auditLog.create({ data: { userId: user.id, action: "LOGOUT", entityType: "USER", entityId: user.id } });
    await clearSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
