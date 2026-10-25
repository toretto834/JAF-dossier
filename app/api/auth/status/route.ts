import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const [count, user] = await Promise.all([db.user.count(), getCurrentUser()]);
  return NextResponse.json({ needsBootstrap: count === 0, user });
}
