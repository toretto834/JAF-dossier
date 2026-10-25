import path from "node:path";
import { createHash } from "node:crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { readOriginal, safeDownloadName } from "@/lib/storage";

type Workspace = any;
const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });

function clean(value: unknown) {
  return String(value ?? "").replace(/[\u2011\u2013\u2014]/g, "-").replace(/\u2192/g, "->").replace(/\u2022/g, "-");
}

function wrap(text: string, width = 92) {
  const words = clean(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (`${line} ${word}`.trim().length > width) { if (line) lines.push(line); line = word; }
    else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines;
}

async function makePdf(title: string, sections: Array<{ heading: string; lines: string[] }>) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]);
  let y = 790;
  const newPage = () => { page = pdf.addPage([595, 842]); y = 790; };
  const line = (value: string, size = 10, font = regular, color = rgb(.12, .16, .13)) => {
    for (const part of wrap(value, size > 15 ? 58 : 92)) {
      if (y < 55) newPage();
      page.drawText(part, { x: 48, y, size, font, color });
      y -= size + 5;
    }
  };
  line(title, 19, bold, rgb(.14, .30, .23));
  line(`Généré le ${fmt.format(new Date())}`, 9, regular, rgb(.38, .42, .39));
  y -= 12;
  for (const section of sections) {
    line(section.heading, 13, bold, rgb(.14, .30, .23));
    for (const value of section.lines.length ? section.lines : ["Aucune information enregistrée."]) line(value, 10);
    y -= 9;
  }
  const pages = pdf.getPages();
  pages.forEach((p, index) => p.drawText(`${index + 1} / ${pages.length}`, { x: 520, y: 25, size: 8, font: regular, color: rgb(.45, .45, .45) }));
  return Buffer.from(await pdf.save());
}

async function makeDocx(title: string, sections: Array<{ heading: string; lines: string[] }>) {
  const children = [new Paragraph({ text: title, heading: HeadingLevel.TITLE }), new Paragraph({ children: [new TextRun({ text: `Généré le ${fmt.format(new Date())}`, italics: true, color: "667069" })] })];
  for (const section of sections) {
    children.push(new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_1 }));
    for (const value of section.lines.length ? section.lines : ["Aucune information enregistrée."]) children.push(new Paragraph({ text: clean(value), bullet: { level: 0 } }));
  }
  return Buffer.from(await Packer.toBuffer(new Document({ sections: [{ properties: {}, children }] })));
}

function neutralize(value: unknown) {
  const text = clean(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

async function makeChronology(workspace: Workspace) {
  const book = new ExcelJS.Workbook();
  book.creator = "JAF Dossier";
  const sheet = book.addWorksheet("Chronologie", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "Date", key: "date", width: 22 }, { header: "Thème", key: "theme", width: 20 }, { header: "Intitulé", key: "title", width: 30 },
    { header: "Description factuelle", key: "description", width: 70 }, { header: "Source", key: "source", width: 20 }, { header: "Statut", key: "status", width: 18 }, { header: "Pièces", key: "evidence", width: 24 },
  ];
  workspace.events.forEach((event: any) => sheet.addRow({ date: fmt.format(new Date(event.occurredAt)), theme: neutralize(event.theme), title: neutralize(event.title), description: neutralize(event.description), source: event.sourceType, status: event.validationStatus, evidence: event.evidenceLinks.map((l: any) => l.evidence.pieceReference).join(", ") }));
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF244D3A" } };
  sheet.eachRow((row) => { row.alignment = { vertical: "top", wrapText: true }; });
  return Buffer.from(await book.xlsx.writeBuffer());
}

async function makeContradictory(workspace: Workspace) {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Accusations - réponses");
  sheet.columns = [{ header: "Réf.", key: "ref", width: 10 }, { header: "Thème", key: "theme", width: 20 }, { header: "Allégation", key: "claim", width: 55 }, { header: "Source", key: "source", width: 28 }, { header: "Réponse factuelle", key: "response", width: 55 }, { header: "Point à vérifier", key: "verify", width: 35 }];
  workspace.allegations.forEach((item: any) => sheet.addRow({ ref: item.reference, theme: neutralize(item.theme), claim: neutralize(item.allegation), source: neutralize(item.source), response: neutralize(item.response), verify: neutralize(item.verificationPoint) }));
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF244D3A" } };
  sheet.eachRow((row) => { row.alignment = { vertical: "top", wrapText: true }; });
  return Buffer.from(await book.xlsx.writeBuffer());
}

export async function buildLawyerZip(workspace: Workspace) {
  const sections = [
    { heading: "Présentation de la situation", lines: [`Dossier ${workspace.reference} - ${workspace.title}`, `Parent : ${workspace.parentIdentity}`, `Autre parent : ${workspace.otherParentIdentity || "Non renseigné"}`, `Juridiction : ${workspace.court || "À préciser"}`] },
    { heading: "Situation des enfants", lines: workspace.children.map((c: any) => `${c.firstName} ${c.lastName || ""}${c.birthDate ? `, né(e) le ${new Date(c.birthDate).toLocaleDateString("fr-FR")}` : ""}`) },
    { heading: "Demandes envisagées", lines: workspace.requests.map((r: any) => `${r.title} : ${r.objective}`) },
    { heading: "Éléments factuels déterminants", lines: workspace.events.slice(0, 20).map((e: any) => `${new Date(e.occurredAt).toLocaleDateString("fr-FR")} - ${e.title} : ${e.description}`) },
    { heading: "Contestations et réponses", lines: workspace.allegations.map((a: any) => `${a.reference} - ${a.allegation} / Réponse : ${a.response || "À préparer"}`) },
    { heading: "Éléments défavorables et difficultés", lines: workspace.events.filter((e: any) => e.unfavorable).map((e: any) => `${e.title} : ${e.description}`) },
    { heading: "Points restant à vérifier", lines: workspace.qualityAlerts.map((a: any) => a.explanation) },
  ];
  const detailed = [
    ...sections,
    { heading: "Chronologie générale", lines: workspace.events.map((e: any) => `${fmt.format(new Date(e.occurredAt))} | ${e.theme} | ${e.title} | Pièces : ${e.evidenceLinks.map((l: any) => l.evidence.pieceReference).join(", ") || "aucune"}`) },
    { heading: "Tableau récapitulatif des preuves", lines: workspace.evidence.map((e: any) => `${e.pieceReference} - ${e.originalName} - Date du document : ${e.documentDate ? new Date(e.documentDate).toLocaleDateString("fr-FR") : "non renseignée"} - Importée le ${new Date(e.createdAt).toLocaleDateString("fr-FR")} - SHA-256 ${e.sha256}`) },
  ];
  const zip = new JSZip();
  const [summaryPdf, summaryDocx, detailPdf, detailDocx, chronology, contradictory] = await Promise.all([
    makePdf("Note de synthèse avocat", sections), makeDocx("Note de synthèse avocat", sections),
    makePdf("Dossier factuel détaillé", detailed), makeDocx("Dossier factuel détaillé", detailed),
    makeChronology(workspace), makeContradictory(workspace),
  ]);
  zip.file("DOSSIER_AVOCAT/00_NOTE_DE_SYNTHESE/Synthese_Avocat.pdf", summaryPdf);
  zip.file("DOSSIER_AVOCAT/00_NOTE_DE_SYNTHESE/Synthese_Avocat.docx", summaryDocx);
  zip.file("DOSSIER_AVOCAT/01_DOSSIER_FACTUEL/Dossier_Complet.pdf", detailPdf);
  zip.file("DOSSIER_AVOCAT/01_DOSSIER_FACTUEL/Dossier_Complet.docx", detailDocx);
  zip.file("DOSSIER_AVOCAT/02_CHRONOLOGIE/Chronologie.xlsx", chronology);
  zip.file("DOSSIER_AVOCAT/03_ACCUSATIONS_REPONSES/Tableau_Contradictoire.xlsx", contradictory);
  const manifest: any[] = [];
  for (const item of workspace.evidence) {
    const contents = await readOriginal(item.relativePath);
    const target = `DOSSIER_AVOCAT/10_PIECES_JUSTIFICATIVES/${item.pieceReference}_${safeDownloadName(item.originalName)}`;
    zip.file(target, contents);
    manifest.push({ reference: item.pieceReference, file: target, originalName: item.originalName, size: item.size, sha256: item.sha256, category: item.category, source: item.source, documentDate: item.documentDate, importedAt: item.createdAt });
  }
  const border = await makePdf("Bordereau des pièces", [{ heading: "Pièces", lines: manifest.map((m) => `${m.reference} - ${m.originalName} - ${m.category} - Date du document : ${m.documentDate ? new Date(m.documentDate).toLocaleDateString("fr-FR") : "non renseignée"}`) }]);
  const questions = await makePdf("Points à examiner avec l’avocat", [{ heading: "Questions et arbitrages", lines: [...workspace.requests.map((r: any) => r.lawyerArbitration).filter(Boolean), ...workspace.qualityAlerts.map((a: any) => a.explanation)] }]);
  zip.file("DOSSIER_AVOCAT/11_QUESTIONS_AVOCAT/Points_A_Examiner.pdf", questions);
  zip.file("DOSSIER_AVOCAT/12_MANIFESTE/Bordereau_Pieces.pdf", border);
  zip.file("DOSSIER_AVOCAT/12_MANIFESTE/Manifest_SHA256.txt", manifest.map((m) => `${m.sha256}  ${m.file}`).join("\n"));
  zip.file("DOSSIER_AVOCAT/12_MANIFESTE/Informations_Export.json", JSON.stringify({ generatedAt: new Date().toISOString(), caseReference: workspace.reference, warning: "Document de travail à vérifier par un avocat. Les empreintes contrôlent l’intégrité depuis l’import, pas l’authenticité juridique.", pieces: manifest }, null, 2));
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
  return { buffer, manifest, sha256: createHash("sha256").update(buffer).digest("hex") };
}
