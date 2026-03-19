#!/usr/bin/env node

/**
 * 보호된 경로 변경 시 커밋을 차단하는 스크립트
 *
 * - src/v0-final/**
 * - docs/**
 * - src/app/globals.css / globals.css
 * - tailwind.config.ts
 * - package.json
 *
 * 위 파일/폴더가 staged 상태이면 exit 1 로 pre-commit 을 실패시킵니다.
 */

import { execSync } from "node:child_process";

function getStagedFiles() {
  const output = execSync("git diff --cached --name-only", {
    encoding: "utf8",
  });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const protectedPatterns = [
  /^src\/v0-final\//,
  /^docs\//,
  /^src\/app\/globals\.css$/,
  /^globals\.css$/,
  /^tailwind\.config\.ts$/,
  /^package\.json$/,
];

function isProtected(file) {
  return protectedPatterns.some((re) => re.test(file));
}

const stagedFiles = getStagedFiles();
const violated = stagedFiles.filter(isProtected);

if (violated.length > 0) {
  console.error("\n❌ 보호된 경로에서 변경이 감지되었습니다. 커밋이 차단됩니다.\n");
  console.error("다음 파일은 직접 수정할 수 없습니다:");
  for (const file of violated) {
    console.error(`  - ${file}`);
  }
  console.error(
    "\nsrc/v0-final/**, docs/**, globals.css, tailwind.config.ts, package.json 은\n" +
      "반드시 사전 계획 보고 및 승인 후에만 수정할 수 있습니다.\n"
  );
  process.exit(1);
}

process.exit(0);

