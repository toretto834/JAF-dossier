const path = require("node:path");
const { chromium } = require("playwright-core");

const output = __dirname;
const edgePath = process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const demoEmail = process.env.JAF_DEMO_EMAIL;
const demoPassword = process.env.JAF_DEMO_PASSWORD;

if (!demoEmail || !demoPassword) {
  throw new Error("Définissez JAF_DEMO_EMAIL et JAF_DEMO_PASSWORD avant de lancer les captures.");
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: edgePath });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  await page.goto("http://127.0.0.1:3000/connexion", { waitUntil: "networkidle" });
  await page.getByLabel("ADRESSE E-MAIL").fill(demoEmail);
  await page.getByLabel("MOT DE PASSE").fill(demoPassword);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/dossier");
  await page.getByRole("heading", { name: "Organisation familiale — démonstration" }).waitFor();
  await page.screenshot({ path: path.join(output, "capture-tableau-de-bord.png"), animations: "disabled" });

  await page.getByRole("button", { name: "Documents et preuves" }).click();
  await page.getByRole("heading", { name: "Documents et preuves" }).waitFor();
  await page.screenshot({ path: path.join(output, "capture-preuves.png"), animations: "disabled" });

  await page.getByRole("button", { name: "Chronologie" }).click();
  await page.getByRole("heading", { name: "Chronologie" }).waitFor();
  await page.screenshot({ path: path.join(output, "capture-chronologie.png"), animations: "disabled" });

  await page.getByRole("button", { name: "Analyse du dossier" }).click();
  await page.getByRole("heading", { name: "Analyse du dossier" }).waitFor();
  await page.screenshot({ path: path.join(output, "capture-analyse.png"), animations: "disabled" });

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
