import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { apiError, assertSameOrigin } from "@/lib/http";

const schema = z.object({ email: z.string().email().transform((v) => v.toLowerCase()), password: z.string().min(1).max(128) });

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const input = schema.parse(await request.json());
    const user = await db.user.findUnique({ where: { email: input.email } });
    if (user?.lockedUntil && user.lockedUntil > new Date()) throw new Error("ACCOUNT_LOCKED");
    const valid = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
    if (!user || !valid) {
      if (user) {
        const attempts = user.failedAttempts + 1;
        await db.user.update({ where: { id: user.id }, data: { failedAttempts: attempts, lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60_000) : null } });
      }
      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
    }
    await db.user.update({ where: { id: user.id }, data: { failedAttempts: 0, lockedUntil: null } });
    await createSession(user.id);
    await db.auditLog.create({ data: { userId: user.id, action: "LOGIN", entityType: "USER", entityId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
