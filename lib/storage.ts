import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";

export const dataRoot = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), "data"));
export const exportRoot = path.resolve(process.env.EXPORT_DIR || path.join(process.cwd(), "exports"));

export function safeResolve(root: string, relativePath: string) {
  const resolved = path.resolve(root, relativePath);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) throw new Error("INVALID_PATH");
  return resolved;
}

export function safeDownloadName(name: string) {
  return name.replace(/[\x00-\x1f\x7f"\\/:*?<>|]+/g, "_").slice(0, 180) || "document";
}

export async function persistOriginal(caseId: string, extension: string, buffer: Buffer) {
  const storageName = `${randomUUID()}${extension.toLowerCase()}`;
  const relativePath = path.join("originals", caseId, storageName);
  const absolutePath = safeResolve(dataRoot, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer, { flag: "wx", mode: 0o600 });
  return { storageName, relativePath, sha256: createHash("sha256").update(buffer).digest("hex") };
}

export async function readOriginal(relativePath: string) {
  return readFile(safeResolve(dataRoot, relativePath));
}

export async function persistExport(relativePath: string, buffer: Buffer) {
  const absolutePath = safeResolve(exportRoot, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer, { flag: "wx", mode: 0o600 });
  return absolutePath;
}
