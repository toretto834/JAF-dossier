import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { fileTypeFromBuffer } from "file-type";
import { requireCaseAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, assertSameOrigin } from "@/lib/http";
import { persistOriginal, safeDownloadName } from "@/lib/storage";

const allowed = new Set([
  "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/jpeg", "image/png", "image/webp",
  "text/plain", "text/csv", "message/rfc822",
]);
const textExtensions = new Set([".txt", ".csv", ".eml"]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const { user } = await requireCaseAccess(id);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    const max = Number(process.env.MAX_UPLOAD_MB || 25) * 1024 * 1024;
    if (file.size < 1 || file.size > max) return NextResponse.json({ error: `Taille autorisée : 1 octet à ${max / 1024 / 1024} Mo` }, { status: 413 });
    const originalName = safeDownloadName(file.name);
    const extension = path.extname(originalName).toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = await fileTypeFromBuffer(buffer);
    const mimeType = detected?.mime || (textExtensions.has(extension) ? file.type : "");
    if (!mimeType || !allowed.has(mimeType)) return NextResponse.json({ error: "Type de fichier refusé" }, { status: 415 });
    const stored = await persistOriginal(id, extension, buffer);
    const count = await db.evidence.count({ where: { caseId: id } });
    const evidence = await db.evidence.create({ data: {
      caseId: id, uploadedById: user.id, pieceReference: `P${String(count + 1).padStart(3, "0")}`,
      originalName, storageName: stored.storageName, relativePath: stored.relativePath, mimeType, size: file.size, sha256: stored.sha256,
      source: String(form.get("source") || "Import utilisateur").slice(0, 500), category: String(form.get("category") || "Autre").slice(0, 100),
      confidentiality: ["STANDARD", "SENSITIVE", "HIGHLY_SENSITIVE"].includes(String(form.get("confidentiality"))) ? String(form.get("confidentiality")) as "STANDARD" | "SENSITIVE" | "HIGHLY_SENSITIVE" : "SENSITIVE",
      documentDate: form.get("documentDate") ? new Date(String(form.get("documentDate"))) : null,
    }});
    await db.auditLog.create({ data: { userId: user.id, caseId: id, action: "UPLOAD", entityType: "EVIDENCE", entityId: evidence.id, metadata: { size: file.size, mimeType } } });
    return NextResponse.json(evidence, { status: 201 });
  } catch (error) { return apiError(error); }
}
