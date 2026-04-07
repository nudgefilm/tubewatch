/**
 * Unit tests for detectDeltaRun.
 *
 * These tests act as a sentinel: if the delta re-analysis logic is removed
 * or accidentally broken, this suite fails immediately on `npm test`.
 *
 * ⚠️  If you are considering removing detectDeltaRun, read the module
 * header first — it explains the cost impact of doing so.
 */

import { describe, it, expect } from "vitest";
import { detectDeltaRun } from "./detectDeltaRun";

// ─── First analysis (no previous snapshot) ───────────────────────────────────

describe("first analysis — no previous snapshot", () => {
  it("null snapshot → isDeltaRun false, all videos treated as new", () => {
    const result = detectDeltaRun(null, ["v1", "v2", "v3"]);
    expect(result.isDeltaRun).toBe(false);
    expect(result.prevKnownCount).toBe(0);
    expect(result.newVideoCount).toBe(3);
  });

  it("undefined snapshot → isDeltaRun false", () => {
    const result = detectDeltaRun(undefined, ["v1"]);
    expect(result.isDeltaRun).toBe(false);
    expect(result.prevKnownCount).toBe(0);
  });

  it("snapshot with empty videos array → isDeltaRun false", () => {
    const result = detectDeltaRun({ videos: [] }, ["v1", "v2"]);
    expect(result.isDeltaRun).toBe(false);
    expect(result.prevKnownCount).toBe(0);
  });

  it("snapshot videos all missing videoId field → isDeltaRun false", () => {
    const snapshot = { videos: [{ title: "no id here" }, {}] };
    const result = detectDeltaRun(snapshot, ["v1"]);
    expect(result.isDeltaRun).toBe(false);
    expect(result.prevKnownCount).toBe(0);
  });
});

// ─── Re-analysis: no new videos ───────────────────────────────────────────────

describe("re-analysis — no new videos (delta run)", () => {
  it("exact same video IDs → isDeltaRun true", () => {
    const snapshot = { videos: [{ videoId: "v1" }, { videoId: "v2" }, { videoId: "v3" }] };
    const result = detectDeltaRun(snapshot, ["v1", "v2", "v3"]);
    expect(result.isDeltaRun).toBe(true);
    expect(result.prevKnownCount).toBe(3);
    expect(result.newVideoCount).toBe(0);
  });

  it("current fetch is a subset of previous (some videos deleted) → isDeltaRun true", () => {
    const snapshot = { videos: [{ videoId: "v1" }, { videoId: "v2" }, { videoId: "v3" }] };
    const result = detectDeltaRun(snapshot, ["v1", "v2"]);
    expect(result.isDeltaRun).toBe(true);
    expect(result.newVideoCount).toBe(0);
  });
});

// ─── Re-analysis: new videos present ─────────────────────────────────────────

describe("re-analysis — new videos present (full Gemini run)", () => {
  // 임계값 = 5: 1~4개 신규는 delta(skip), 5개 이상만 Gemini 재호출
  it("1개 신규 → isDeltaRun true (임계값 미달, Gemini 스킵)", () => {
    const snapshot = { videos: [{ videoId: "v1" }, { videoId: "v2" }] };
    const result = detectDeltaRun(snapshot, ["v1", "v2", "v3"]);
    expect(result.isDeltaRun).toBe(true);
    expect(result.newVideoCount).toBe(1);
  });

  it("4개 신규 → isDeltaRun true (임계값 미달, Gemini 스킵)", () => {
    const snapshot = { videos: [{ videoId: "v1" }] };
    const result = detectDeltaRun(snapshot, ["v1", "v2", "v3", "v4", "v5"]);
    expect(result.isDeltaRun).toBe(true);
    expect(result.newVideoCount).toBe(4);
  });

  it("5개 신규 → isDeltaRun false (임계값 도달, Gemini 재호출)", () => {
    const snapshot = { videos: [{ videoId: "v1" }] };
    const result = detectDeltaRun(snapshot, ["v1", "v2", "v3", "v4", "v5", "v6"]);
    expect(result.isDeltaRun).toBe(false);
    expect(result.newVideoCount).toBe(5);
  });

  it("10개 신규 → isDeltaRun false, count correct", () => {
    const snapshot = { videos: [{ videoId: "old1" }] };
    const ids = ["old1", ...Array.from({ length: 10 }, (_, i) => `new${i}`)];
    const result = detectDeltaRun(snapshot, ids);
    expect(result.isDeltaRun).toBe(false);
    expect(result.newVideoCount).toBe(10);
  });

  it("완전히 다른 ID 3개 → isDeltaRun true (5개 미달)", () => {
    const snapshot = { videos: [{ videoId: "old1" }, { videoId: "old2" }] };
    const result = detectDeltaRun(snapshot, ["new1", "new2", "new3"]);
    expect(result.isDeltaRun).toBe(true);
    expect(result.newVideoCount).toBe(3);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("current video list is empty → isDeltaRun true (reuse prev rather than calling Gemini with 0 videos)", () => {
    const snapshot = { videos: [{ videoId: "v1" }] };
    const result = detectDeltaRun(snapshot, []);
    // YouTube returned 0 videos — treating as delta (skip Gemini) is safer
    // than calling Gemini with an empty video list
    expect(result.isDeltaRun).toBe(true);
    expect(result.newVideoCount).toBe(0);
  });

  it("snapshot has mixed: some videos with videoId, some without → only valid IDs counted", () => {
    const snapshot = { videos: [{ videoId: "v1" }, { videoId: "" }, { title: "no id" }, { videoId: "v2" }] };
    const result = detectDeltaRun(snapshot, ["v1", "v2"]);
    expect(result.isDeltaRun).toBe(true);
    expect(result.prevKnownCount).toBe(2);
  });

  it("malformed snapshot (not an object) → safe fallback, isDeltaRun false", () => {
    expect(detectDeltaRun("bad data", ["v1"]).isDeltaRun).toBe(false);
    expect(detectDeltaRun(42, ["v1"]).isDeltaRun).toBe(false);
    expect(detectDeltaRun([], ["v1"]).isDeltaRun).toBe(false);
  });
});
