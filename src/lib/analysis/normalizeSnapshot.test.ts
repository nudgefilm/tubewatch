import { describe, it, expect } from "vitest"
import {
  normalizeFeatureSnapshot,
  detectSnapshotVersion,
  formatDurationSecondsLabel,
} from "./normalizeSnapshot"

// ─── formatDurationSecondsLabel ──────────────────────────────────────────────

describe("formatDurationSecondsLabel", () => {
  it("정상 초 단위 → M:SS 형식 반환", () => {
    expect(formatDurationSecondsLabel(313)).toBe("5:13")
    expect(formatDurationSecondsLabel(60)).toBe("1:00")
    expect(formatDurationSecondsLabel(0)).toBe("0:00")
    expect(formatDurationSecondsLabel(3661)).toBe("61:01")
  })

  it("null / undefined / 음수 / NaN → '—' 반환", () => {
    expect(formatDurationSecondsLabel(null)).toBe("—")
    expect(formatDurationSecondsLabel(undefined)).toBe("—")
    expect(formatDurationSecondsLabel(-1)).toBe("—")
    expect(formatDurationSecondsLabel(NaN)).toBe("—")
    expect(formatDurationSecondsLabel(Infinity)).toBe("—")
  })
})

// ─── detectSnapshotVersion ───────────────────────────────────────────────────

describe("detectSnapshotVersion", () => {
  it("null / undefined / 원시값 → v0", () => {
    expect(detectSnapshotVersion(null)).toBe("v0")
    expect(detectSnapshotVersion(undefined)).toBe("v0")
    expect(detectSnapshotVersion("string")).toBe("v0")
    expect(detectSnapshotVersion(42)).toBe("v0")
    expect(detectSnapshotVersion({})).toBe("v0")
  })

  it("videos + metrics 있음, interpretationMode 없음 → v1", () => {
    const snap = { videos: [], metrics: { avgViewCount: 1000 } }
    expect(detectSnapshotVersion(snap)).toBe("v1")
  })

  it("sample_videos + metrics 있음 → v1", () => {
    const snap = { sample_videos: [{ title: "Test" }], metrics: { avgViewCount: 500 } }
    expect(detectSnapshotVersion(snap)).toBe("v1")
  })

  it("interpretationMode(camelCase) 있음 → v2", () => {
    const snap = {
      videos: [],
      metrics: {},
      interpretationMode: "early_stage_signal_based",
    }
    expect(detectSnapshotVersion(snap)).toBe("v2")
  })

  it("interpretation_mode(snake_case) 있음 → v2", () => {
    const snap = {
      videos: [],
      metrics: {},
      interpretation_mode: "growth_stage_pattern_based",
    }
    expect(detectSnapshotVersion(snap)).toBe("v2")
  })

  it("videos 없고 metrics도 없음 → v0", () => {
    const snap = { patterns: ["some_flag"] }
    expect(detectSnapshotVersion(snap)).toBe("v0")
  })
})

// ─── normalizeFeatureSnapshot — 경계 케이스 ──────────────────────────────────

describe("normalizeFeatureSnapshot — 경계 케이스", () => {
  it("null 입력 → 기본값 반환, crash 없음", () => {
    const result = normalizeFeatureSnapshot(null)
    expect(result.videos).toEqual([])
    expect(result.metrics).toBeNull()
    expect(result.patterns).toEqual([])
    expect(result.interpretationMode).toBe("early_stage_signal_based")
    expect(result.version).toBe("v0")
  })

  it("undefined 입력 → 기본값 반환, crash 없음", () => {
    const result = normalizeFeatureSnapshot(undefined)
    expect(result.videos).toEqual([])
    expect(result.metrics).toBeNull()
    expect(result.patterns).toEqual([])
    expect(result.interpretationMode).toBe("early_stage_signal_based")
  })

  it("빈 객체 → 기본값 반환", () => {
    const result = normalizeFeatureSnapshot({})
    expect(result.videos).toEqual([])
    expect(result.metrics).toBeNull()
    expect(result.patterns).toEqual([])
    expect(result.interpretationMode).toBe("early_stage_signal_based")
  })

  it("문자열 입력 → 기본값 반환, crash 없음", () => {
    const result = normalizeFeatureSnapshot("not an object")
    expect(result.videos).toEqual([])
    expect(result.metrics).toBeNull()
  })
})

// ─── videos 파싱 ─────────────────────────────────────────────────────────────

describe("normalizeFeatureSnapshot — videos", () => {
  it("videos 없음 → 빈 배열 (v0 구버전 snapshot)", () => {
    const result = normalizeFeatureSnapshot({ metrics: { avgViewCount: 100 } })
    expect(result.videos).toEqual([])
  })

  it("sample_videos 폴백: videos 없을 때 sample_videos 사용", () => {
    const snap = {
      sample_videos: [
        { title: "레거시 영상", publishedAt: "2024-01-01" },
      ],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.videos).toHaveLength(1)
    expect(result.videos[0].title).toBe("레거시 영상")
  })

  it("videos가 빈 배열 → 빈 배열 반환", () => {
    const result = normalizeFeatureSnapshot({ videos: [] })
    expect(result.videos).toEqual([])
  })

  it("title 없는 항목 제외", () => {
    const snap = {
      videos: [
        { title: "정상 영상" },
        { title: "" },
        { publishedAt: "2024-01-01" }, // title 없음
        null,
        42,
      ],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.videos).toHaveLength(1)
    expect(result.videos[0].title).toBe("정상 영상")
  })

  it("타입이 섞인 videos 배열 → 유효한 항목만 추출", () => {
    const snap = {
      videos: [
        { title: "영상 A", viewCount: 1000 },
        null,
        undefined,
        "string",
        { title: "  " }, // 공백만 → 제외
        { title: "영상 B" },
      ],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.videos).toHaveLength(2)
    expect(result.videos.map((v) => v.title)).toEqual(["영상 A", "영상 B"])
  })

  it("publishedAt — camelCase / snake_case 양쪽 지원", () => {
    const snap = {
      videos: [
        { title: "A", publishedAt: "2024-03-01" },
        { title: "B", published_at: "2024-02-01" },
      ],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.videos[0].publishedAt).toBe("2024-03-01")
    expect(result.videos[1].publishedAt).toBe("2024-02-01")
  })

  it("viewCount — camelCase / snake_case 양쪽 지원", () => {
    const snap = {
      videos: [
        { title: "A", viewCount: 5000 },
        { title: "B", view_count: 3000 },
      ],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.videos[0].viewCount).toBe(5000)
    expect(result.videos[1].viewCount).toBe(3000)
  })
})

// ─── duration 파싱 ────────────────────────────────────────────────────────────

describe("normalizeFeatureSnapshot — duration 파싱", () => {
  it("durationSeconds 숫자 → M:SS 레이블", () => {
    const snap = {
      videos: [{ title: "영상", durationSeconds: 313 }],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.videos[0].durationSeconds).toBe(313)
    expect(result.videos[0].durationLabel).toBe("5:13")
  })

  it("ISO 8601 문자열 PT5M13S → durationSeconds 313, 레이블 5:13", () => {
    const snap = {
      videos: [{ title: "영상", duration: "PT5M13S" }],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.videos[0].durationSeconds).toBe(313)
    expect(result.videos[0].durationLabel).toBe("5:13")
  })

  it("ISO 8601 시간 포함 PT1H2M3S → 3723초", () => {
    const snap = {
      videos: [{ title: "영상", duration: "PT1H2M3S" }],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.videos[0].durationSeconds).toBe(3723)
    expect(result.videos[0].durationLabel).toBe("62:03")
  })

  it("durationSeconds 우선 — duration 문자열보다 먼저 처리", () => {
    const snap = {
      videos: [{ title: "영상", durationSeconds: 100, duration: "PT10M0S" }],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.videos[0].durationSeconds).toBe(100)
    expect(result.videos[0].durationLabel).toBe("1:40")
  })

  it("duration 값 없음 → durationSeconds null, durationLabel '—'", () => {
    const snap = {
      videos: [{ title: "영상" }],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.videos[0].durationSeconds).toBeNull()
    expect(result.videos[0].durationLabel).toBe("—")
  })

  it("레거시 문자열(ISO 파싱 불가) → durationSeconds null, durationLabel은 원본 문자열", () => {
    const snap = {
      videos: [{ title: "영상", duration: "5분 13초" }],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.videos[0].durationSeconds).toBeNull()
    // 파싱 불가 레거시 문자열은 그대로 통과
    expect(result.videos[0].durationLabel).toBe("5분 13초")
  })

  it("PT0S → 0초, parseDuration이 0을 반환하면 '—' 처리", () => {
    const snap = {
      videos: [{ title: "영상", duration: "PT0S" }],
    }
    const result = normalizeFeatureSnapshot(snap)
    // PT0S → sec=0 → parseDurationStringToSeconds returns 0 → not > 0 → fallback to null/'—'
    expect(result.videos[0].durationSeconds).toBeNull()
    expect(result.videos[0].durationLabel).toBe("—")
  })

  it("형식 혼합: 영상별로 다른 duration 형식 → 각자 독립 처리", () => {
    const snap = {
      videos: [
        { title: "A", durationSeconds: 60 },
        { title: "B", duration: "PT3M30S" },
        { title: "C" },
      ],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.videos[0].durationLabel).toBe("1:00")
    expect(result.videos[1].durationLabel).toBe("3:30")
    expect(result.videos[2].durationLabel).toBe("—")
  })
})

// ─── thumbnail null-safe ──────────────────────────────────────────────────────

describe("normalizeFeatureSnapshot — thumbnail null-safe", () => {
  it("thumbnail 키 우선 탐색", () => {
    const snap = {
      videos: [{
        title: "영상",
        thumbnail: "https://example.com/thumb.jpg",
        thumbnailUrl: "https://example.com/other.jpg",
      }],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.videos[0].thumbnailUrl).toBe("https://example.com/thumb.jpg")
  })

  it("thumbnail 없으면 thumbnailUrl 탐색", () => {
    const snap = {
      videos: [{ title: "영상", thumbnailUrl: "https://example.com/thumb.jpg" }],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.videos[0].thumbnailUrl).toBe("https://example.com/thumb.jpg")
  })

  it("thumbnailUrl 없으면 thumbnail_url 탐색", () => {
    const snap = {
      videos: [{ title: "영상", thumbnail_url: "https://example.com/thumb.jpg" }],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.videos[0].thumbnailUrl).toBe("https://example.com/thumb.jpg")
  })

  it("빈 문자열은 null 처리 (thumbnail)", () => {
    const snap = {
      videos: [{ title: "영상", thumbnail: "" }],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.videos[0].thumbnailUrl).toBeNull()
  })

  it("빈 문자열은 null 처리 — 다음 키로 fallback", () => {
    const snap = {
      videos: [{ title: "영상", thumbnail: "", thumbnailUrl: "https://example.com/t.jpg" }],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.videos[0].thumbnailUrl).toBe("https://example.com/t.jpg")
  })

  it("모든 thumbnail 키 없음 → null", () => {
    const snap = {
      videos: [{ title: "영상", viewCount: 100 }],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.videos[0].thumbnailUrl).toBeNull()
  })

  it("결과는 항상 string | null — 빈 문자열 절대 반환 안 함", () => {
    const snaps = [
      { videos: [{ title: "A", thumbnail: "" }] },
      { videos: [{ title: "B", thumbnailUrl: "" }] },
      { videos: [{ title: "C", thumbnail_url: "" }] },
      { videos: [{ title: "D" }] },
    ]
    for (const snap of snaps) {
      const result = normalizeFeatureSnapshot(snap)
      const url = result.videos[0].thumbnailUrl
      expect(url === null || (typeof url === "string" && url.length > 0)).toBe(true)
    }
  })
})

// ─── interpretationMode 기본값 ────────────────────────────────────────────────

describe("normalizeFeatureSnapshot — interpretationMode", () => {
  it("미존재 시 'early_stage_signal_based' 기본값", () => {
    const result = normalizeFeatureSnapshot({ videos: [], metrics: {} })
    expect(result.interpretationMode).toBe("early_stage_signal_based")
  })

  it("camelCase interpretationMode 인식", () => {
    const result = normalizeFeatureSnapshot({
      interpretationMode: "growth_stage_pattern_based",
    })
    expect(result.interpretationMode).toBe("growth_stage_pattern_based")
  })

  it("snake_case interpretation_mode 인식", () => {
    const result = normalizeFeatureSnapshot({
      interpretation_mode: "scale_stage_optimization",
    })
    expect(result.interpretationMode).toBe("scale_stage_optimization")
  })

  it("유효하지 않은 값 → 기본값 fallback", () => {
    const result = normalizeFeatureSnapshot({
      interpretationMode: "unknown_mode_xyz",
    })
    expect(result.interpretationMode).toBe("early_stage_signal_based")
  })

  it("null 값 → 기본값 fallback", () => {
    const result = normalizeFeatureSnapshot({
      interpretationMode: null,
    })
    expect(result.interpretationMode).toBe("early_stage_signal_based")
  })
})

// ─── metrics 정규화 ───────────────────────────────────────────────────────────

describe("normalizeFeatureSnapshot — metrics", () => {
  it("숫자 값만 포함한 Record로 정리", () => {
    const snap = {
      metrics: {
        avgViewCount: 1500,
        avgLikeCount: 30.5,
        label: "ignored",
        flag: true,
        nothing: null,
      },
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.metrics).toEqual({ avgViewCount: 1500, avgLikeCount: 30.5 })
  })

  it("숫자가 아닌 값은 모두 제외", () => {
    const snap = {
      metrics: {
        str: "text",
        arr: [1, 2],
        obj: { a: 1 },
        bool: false,
        nil: null,
      },
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.metrics).toBeNull()
  })

  it("metrics 없음 → null", () => {
    const result = normalizeFeatureSnapshot({ videos: [] })
    expect(result.metrics).toBeNull()
  })

  it("빈 metrics 객체 → null", () => {
    const result = normalizeFeatureSnapshot({ metrics: {} })
    expect(result.metrics).toBeNull()
  })

  it("metrics가 배열 → null (배열은 객체지만 무시)", () => {
    const result = normalizeFeatureSnapshot({ metrics: [1, 2, 3] })
    expect(result.metrics).toBeNull()
  })

  it("Infinity / NaN 값은 제외", () => {
    const snap = {
      metrics: {
        valid: 100,
        inf: Infinity,
        nan: NaN,
      },
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.metrics).toEqual({ valid: 100 })
  })
})

// ─── patterns 정규화 ──────────────────────────────────────────────────────────

describe("normalizeFeatureSnapshot — patterns", () => {
  it("문자열 배열만 안전하게 추출", () => {
    const snap = {
      patterns: ["low_tag_usage", "repeated_topic_pattern"],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.patterns).toEqual(["low_tag_usage", "repeated_topic_pattern"])
  })

  it("이상한 타입 섞여도 문자열만 추출", () => {
    const snap = {
      patterns: ["valid_flag", 42, null, true, { key: "val" }, "  another_flag  "],
    }
    const result = normalizeFeatureSnapshot(snap)
    // 공백 포함 문자열도 trim 후 길이 > 0이면 포함
    expect(result.patterns).toContain("valid_flag")
    expect(result.patterns).toContain("another_flag")
    expect(result.patterns).not.toContain(42)
    expect(result.patterns).not.toContain(null)
    expect(result.patterns).not.toContain(true)
  })

  it("빈 문자열은 제외", () => {
    const snap = {
      patterns: ["valid", "", "   "],
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.patterns).toEqual(["valid"])
  })

  it("patterns 없음 → 빈 배열", () => {
    const result = normalizeFeatureSnapshot({ videos: [] })
    expect(result.patterns).toEqual([])
  })

  it("patterns가 배열이 아님 → 빈 배열", () => {
    const result = normalizeFeatureSnapshot({ patterns: "not_an_array" })
    expect(result.patterns).toEqual([])
  })
})

// ─── 버전 감지 통합 ────────────────────────────────────────────────────────────

describe("normalizeFeatureSnapshot — 버전 통합", () => {
  it("v0 구버전 snapshot: videos/metrics 없음 → version v0, videos 빈 배열", () => {
    const snap = { patterns: ["some_flag"] }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.version).toBe("v0")
    expect(result.videos).toEqual([])
  })

  it("v1 snapshot: videos + metrics 있음 → version v1", () => {
    const snap = {
      videos: [{ title: "영상" }],
      metrics: { avgViewCount: 1000 },
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.version).toBe("v1")
    expect(result.videos).toHaveLength(1)
  })

  it("v2 snapshot: interpretationMode 있음 → version v2, 모드 반영", () => {
    const snap = {
      videos: [{ title: "영상" }],
      metrics: { avgViewCount: 2000 },
      interpretationMode: "growth_stage_pattern_based",
    }
    const result = normalizeFeatureSnapshot(snap)
    expect(result.version).toBe("v2")
    expect(result.interpretationMode).toBe("growth_stage_pattern_based")
  })
})

// ─── 반환 타입 계약 (contract) ─────────────────────────────────────────────────

describe("normalizeFeatureSnapshot — 반환 타입 계약", () => {
  const cases = [
    null,
    undefined,
    {},
    { videos: [] },
    { videos: [{ title: "T" }], metrics: { v: 1 }, patterns: ["p"] },
    { sample_videos: [{ title: "T" }], interpretationMode: "early_stage_signal_based" },
  ]

  for (const input of cases) {
    it(`입력: ${JSON.stringify(input)} → 항상 계약 충족`, () => {
      const result = normalizeFeatureSnapshot(input)
      // videos: 배열
      expect(Array.isArray(result.videos)).toBe(true)
      // patterns: 배열
      expect(Array.isArray(result.patterns)).toBe(true)
      // interpretationMode: 유효한 문자열
      expect(typeof result.interpretationMode).toBe("string")
      expect(result.interpretationMode.length).toBeGreaterThan(0)
      // version: v0/v1/v2
      expect(["v0", "v1", "v2"]).toContain(result.version)
      // metrics: null or Record<string, number>
      if (result.metrics !== null) {
        expect(typeof result.metrics).toBe("object")
        for (const v of Object.values(result.metrics)) {
          expect(typeof v).toBe("number")
          expect(Number.isFinite(v)).toBe(true)
        }
      }
      // 각 video의 thumbnailUrl은 빈 문자열 없음
      for (const v of result.videos) {
        expect(typeof v.title).toBe("string")
        expect(v.title.length).toBeGreaterThan(0)
        if (v.thumbnailUrl !== null) {
          expect(typeof v.thumbnailUrl).toBe("string")
          expect(v.thumbnailUrl.length).toBeGreaterThan(0)
        }
        // durationLabel은 항상 표시 가능
        expect(typeof v.durationLabel).toBe("string")
        expect(v.durationLabel.length).toBeGreaterThan(0)
      }
    })
  }
})
