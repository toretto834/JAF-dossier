import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) throw new Error("INVALID_ORIGIN");
}

export function apiError(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: "Données invalides", details: error.flatten() }, { status: 400 });
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    if (error.message === "NOT_FOUND") return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });
    if (error.message === "INVALID_ORIGIN") return NextResponse.json({ error: "Origine refusée" }, { status: 403 });
    if (error.message === "ACCOUNT_LOCKED") return NextResponse.json({ error: "Compte temporairement verrouillé" }, { status: 429 });
  }
  console.error(error);
  return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
}
