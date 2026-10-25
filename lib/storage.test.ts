import path from "node:path";
import { describe, expect, it } from "vitest";
import { safeDownloadName, safeResolve } from "./storage";

describe("stockage sécurisé", () => {
  it("résout un chemin interne à la racine", () => {
    const root = path.resolve("C:/jaf-data");
    expect(safeResolve(root, path.join("originals", "case-1", "file.pdf"))).toContain("case-1");
  });

  it("refuse une traversée de répertoire", () => {
    const root = path.resolve("C:/jaf-data");
    expect(() => safeResolve(root, path.join("..", "secret.txt"))).toThrow("INVALID_PATH");
  });

  it("neutralise les caractères dangereux dans un nom téléchargé", () => {
    expect(safeDownloadName('../preuve:<1>.pdf')).toBe(".._preuve_1_.pdf");
  });
});
