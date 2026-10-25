import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { apiError, assertSameOrigin } from "@/lib/http";

const inputSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160).transform((v) => v.toLowerCase()),
  password: z.string().min(12).max(128),
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    if (await db.user.count()) return NextResponse.json({ error: "Le compte initial existe déjà" }, { status: 409 });
    const input = inputSchema.parse(await request.json());
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await db.user.create({
      data: {
        displayName: input.displayName,
        email: input.email,
        passwordHash,
      },
    });
    await createSession(user.id);
    await db.auditLog.create({ data: { userId: user.id, action: "BOOTSTRAP", entityType: "USER", entityId: user.id } });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
