import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";

const COOKIE = "jaf_session";

function getSessionSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters");
  }
  return new TextEncoder().encode(value);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSessionSecret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production" && process.env.APP_URL?.startsWith("https://"),
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
}

export async function getCurrentUser() {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSessionSecret());
    if (!payload.sub) return null;
    return db.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, displayName: true } });
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireCaseAccess(caseId: string) {
  const user = await requireUser();
  const familyCase = await db.familyCase.findFirst({ where: { id: caseId, ownerId: user.id, archivedAt: null } });
  if (!familyCase) throw new Error("NOT_FOUND");
  return { user, familyCase };
}
