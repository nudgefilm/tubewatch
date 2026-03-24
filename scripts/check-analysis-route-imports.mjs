#!/usr/bin/env node
/**
 * /analysis 운영 라우트 import 체인 검사.
 * 금지 경로(legacy analysis 페이지·v0-final 등)가 엔트리에서 도달하면 exit 1.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const ENTRY = path.join(ROOT, "src/app/(app)/analysis/page.tsx");

const FORBIDDEN_IMPORT_SUBSTRINGS = [
  "@/v0-tubewatchui/app/(app)/analysis",
  "@/v0-core/app/(app)/analysis",
  "v0-tubewatchui/app/(app)/analysis",
  "v0-core/app/(app)/analysis",
  "/v0-final/",
  "src/v0-final",
];

const EXPECTED_CLIENT =
  "@/components/analysis/AnalysisReportPageClient";

function existsFile(p) {
  return fs.existsSync(p) && fs.statSync(p).isFile();
}

function tryResolveTsFile(basePathNoExt) {
  const exts = [".tsx", ".ts", "/index.tsx", "/index.ts"];
  for (const ext of exts) {
    const p = basePathNoExt + ext;
    if (existsFile(p)) return p;
  }
  return null;
}

/**
 * Minimal @/ resolution matching tsconfig (order matters for @/components, @/lib, @/hooks).
 */
function resolveAlias(importPath, fromDir) {
  const normalized = importPath.replace(/\\/g, "/");

  if (normalized.startsWith("@/v0-tubewatchui/")) {
    const rest = normalized.slice("@/v0-tubewatchui/".length);
    return tryResolveTsFile(path.join(ROOT, "v0-TubewatchUI", rest));
  }
  if (normalized.startsWith("@/v0-core/")) {
    const rest = normalized.slice("@/v0-core/".length);
    return tryResolveTsFile(path.join(ROOT, "src/v0-core", rest));
  }
  if (normalized.startsWith("@/components/")) {
    const rest = normalized.slice("@/components/".length);
    const a = tryResolveTsFile(
      path.join(ROOT, "v0-TubewatchUI/components", rest)
    );
    if (a) return a;
    return tryResolveTsFile(path.join(ROOT, "src/components", rest));
  }
  if (normalized.startsWith("@/hooks/")) {
    const rest = normalized.slice("@/hooks/".length);
    const a = tryResolveTsFile(path.join(ROOT, "v0-TubewatchUI/hooks", rest));
    if (a) return a;
    return tryResolveTsFile(path.join(ROOT, "src/hooks", rest));
  }
  if (normalized.startsWith("@/lib/")) {
    const rest = normalized.slice("@/lib/".length);
    if (rest === "utils") {
      const u1 = path.join(ROOT, "v0-TubewatchUI/lib/utils.ts");
      if (existsFile(u1)) return u1;
      const u2 = path.join(ROOT, "src/lib/utils.ts");
      if (existsFile(u2)) return u2;
    }
    const a = tryResolveTsFile(path.join(ROOT, "v0-TubewatchUI/lib", rest));
    if (a) return a;
    return tryResolveTsFile(path.join(ROOT, "src/lib", rest));
  }
  if (normalized.startsWith("@/")) {
    const rest = normalized.slice(2);
    return tryResolveTsFile(path.join(ROOT, "src", rest));
  }

  if (normalized.startsWith(".")) {
    const resolved = path.resolve(fromDir, normalized);
    return tryResolveTsFile(resolved);
  }
  return null;
}

const importRe =
  /(?:import|export)\s+(?:[\s\S]*?from\s+)?["']([^"']+)["']|import\s+["']([^"']+)["']/g;

function extractImports(source) {
  const out = [];
  let m;
  while ((m = importRe.exec(source)) !== null) {
    const spec = m[1] || m[2];
    if (spec && !spec.startsWith("node:")) out.push(spec);
  }
  return out;
}

function checkForbidden(spec, chainFile) {
  for (const bad of FORBIDDEN_IMPORT_SUBSTRINGS) {
    if (spec.includes(bad)) {
      console.error(
        `\n❌ 금지된 import가 감지되었습니다.\n  파일: ${path.relative(ROOT, chainFile)}\n  import: ${spec}\n  규칙: ${bad}\n`
      );
      process.exit(1);
    }
  }
}

function walkChain(entryPath, visited = new Set()) {
  const abs = path.normalize(entryPath);
  if (visited.has(abs)) return;
  visited.add(abs);

  const text = fs.readFileSync(abs, "utf8");
  const imports = extractImports(text);

  const libUnderSrc = path.join(ROOT, "src", "lib");
  const stopRecursingIntoLib =
    abs.startsWith(libUnderSrc + path.sep) || abs === libUnderSrc;

  for (const spec of imports) {
    checkForbidden(spec, abs);
    if (stopRecursingIntoLib) continue;
    const fromDir = path.dirname(abs);
    const resolved = resolveAlias(spec, fromDir);
    if (resolved && resolved.startsWith(ROOT) && /\.(tsx|ts)$/.test(resolved)) {
      walkChain(resolved, visited);
    }
  }

  return visited;
}

function assertEntryUsesClient() {
  const src = fs.readFileSync(ENTRY, "utf8");
  if (!src.includes(EXPECTED_CLIENT)) {
    console.error(
      `\n❌ ${path.relative(ROOT, ENTRY)} 에서 운영 클라이언트 엔트리가 필요합니다:\n  ${EXPECTED_CLIENT}\n`
    );
    process.exit(1);
  }
  if (!src.includes("AnalysisReportPageClient")) {
    console.error(
      `\n❌ AnalysisReportPageClient 가 import 되어야 합니다.\n`
    );
    process.exit(1);
  }
}

function main() {
  if (!existsFile(ENTRY)) {
    console.error(`Missing entry: ${ENTRY}`);
    process.exit(1);
  }

  assertEntryUsesClient();

  const visited = walkChain(ENTRY);
  const ordered = [...visited].sort((a, b) =>
    path.relative(ROOT, a).localeCompare(path.relative(ROOT, b))
  );

  console.log("✅ /analysis 운영 import chain (resolved .ts/.tsx files):\n");
  for (const f of ordered) {
    console.log(`  ${path.relative(ROOT, f).replace(/\\/g, "/")}`);
  }
  console.log("");
}

main();
