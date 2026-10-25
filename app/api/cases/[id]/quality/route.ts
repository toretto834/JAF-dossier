import { NextRequest, NextResponse } from "next/server";
import { requireCaseAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, assertSameOrigin } from "@/lib/http";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const { user } = await requireCaseAccess(id);
    const [events, requests, evidence, allegations] = await Promise.all([
      db.event.findMany({ where: { caseId: id }, include: { evidenceLinks: true } }),
      db.legalRequest.findMany({ where: { caseId: id }, include: { eventLinks: true, evidenceLinks: true } }),
      db.evidence.findMany({ where: { caseId: id } }),
      db.allegation.findMany({ where: { caseId: id } }),
    ]);
    const alerts: Array<{ entityType: string; entityId?: string; ruleCode: string; severity: "INFO" | "WARNING" | "BLOCKING"; explanation: string }> = [];
    for (const event of events) {
      if (!event.evidenceLinks.length) alerts.push({ entityType: "EVENT", entityId: event.id, ruleCode: "EVENT_WITHOUT_EVIDENCE", severity: "WARNING", explanation: `L’événement « ${event.title} » ne comporte aucune pièce associée.` });
      if (event.needsVerification) alerts.push({ entityType: "EVENT", entityId: event.id, ruleCode: "EVENT_TO_VERIFY", severity: "WARNING", explanation: `L’événement « ${event.title} » est marqué comme devant être vérifié.` });
    }
    for (const item of requests) if (!item.eventLinks.length || !item.evidenceLinks.length) alerts.push({ entityType: "LEGAL_REQUEST", entityId: item.id, ruleCode: "REQUEST_INCOMPLETE_CHAIN", severity: "WARNING", explanation: `La demande « ${item.title} » n’est pas encore reliée à la fois à un fait et à une preuve.` });
    for (const item of allegations) if (!item.response) alerts.push({ entityType: "ALLEGATION", entityId: item.id, ruleCode: "ALLEGATION_WITHOUT_RESPONSE", severity: "WARNING", explanation: `${item.reference} ne comporte pas encore de réponse factuelle.` });
    const hashGroups = new Map<string, typeof evidence>();
    for (const item of evidence) hashGroups.set(item.sha256, [...(hashGroups.get(item.sha256) || []), item]);
    for (const [, duplicates] of hashGroups) if (duplicates.length > 1) alerts.push({ entityType: "EVIDENCE", entityId: duplicates[0].id, ruleCode: "DUPLICATE_FILE", severity: "INFO", explanation: `Le même contenu a été importé ${duplicates.length} fois (${duplicates.map((x) => x.pieceReference).join(", ")}).` });
    if (!evidence.length) alerts.push({ entityType: "CASE", entityId: id, ruleCode: "NO_EVIDENCE", severity: "BLOCKING", explanation: "Aucune pièce n’est encore disponible pour ce dossier." });
    await db.$transaction([
      db.qualityAlert.deleteMany({ where: { caseId: id, resolvedAt: null } }),
      ...alerts.map((alert) => db.qualityAlert.create({ data: { caseId: id, ...alert } })),
      db.auditLog.create({ data: { userId: user.id, caseId: id, action: "QUALITY_CHECK", entityType: "CASE", entityId: id, metadata: { alertCount: alerts.length } } }),
    ]);
    return NextResponse.json({ count: alerts.length });
  } catch (error) { return apiError(error); }
}
