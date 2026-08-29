import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

function getAllFiles(dir: string, extensions = [".ts", ".js", ".html", ".css"]): string[] {
  let files: string[] = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name !== "node_modules" && item.name !== "dist" && item.name !== ".git") {
        files = files.concat(getAllFiles(fullPath, extensions));
      }
    } else if (extensions.some((ext) => item.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("Privacy & Local-Only Security Audit", () => {
  const srcDir = path.resolve(__dirname, "../src");
  const rootIndexHtml = path.resolve(__dirname, "../index.html");
  const sourceFiles = [...getAllFiles(srcDir), rootIndexHtml];

  it("contains zero network transmission API calls (fetch, xhr, beacon, ws)", () => {
    const forbiddenApis = [
      /\bfetch\s*\(/i,
      /\bXMLHttpRequest\b/i,
      /\bsendBeacon\s*\(/i,
      /\bWebSocket\b/i,
    ];

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      for (const pattern of forbiddenApis) {
        expect(
          pattern.test(content),
          `Forbidden network API match (${pattern}) found in ${path.relative(process.cwd(), filePath)}`
        ).toBe(false);
      }
    }
  });

  it("contains zero persistent browser storage API calls (localStorage, sessionStorage, indexedDB, cookie)", () => {
    const forbiddenStorage = [
      /\blocalStorage\b/i,
      /\bsessionStorage\b/i,
      /\bindexedDB\b/i,
      /\bdocument\.cookie\b/i,
    ];

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      for (const pattern of forbiddenStorage) {
        expect(
          pattern.test(content),
          `Forbidden storage API match (${pattern}) found in ${path.relative(process.cwd(), filePath)}`
        ).toBe(false);
      }
    }
  });

  it("index.html contains no external scripts, analytics, or remote tracking beacons", () => {
    const content = fs.readFileSync(rootIndexHtml, "utf-8");
    expect(content).not.toContain("google-analytics");
    expect(content).not.toContain("googletagmanager");
    expect(content).not.toContain("mixpanel");
    expect(content).not.toContain("hotjar");
    expect(content).not.toContain("segment");
    expect(/<script[^>]+src=["']https?:\/\//i.test(content)).toBe(false);
  });
});
