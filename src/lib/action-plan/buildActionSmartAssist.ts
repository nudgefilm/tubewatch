import type {
  ActionImpactArea,
  ActionItem,
  ActionSmartAssist,
} from "@/components/action-plan/types";

function clip(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function midjourney(item: ActionItem): ActionSmartAssist {
  const topic = clip(item.title, 42);
  return {
    toolName: "Midjourney",
    reason:
      "액션 제목·이유에 시각 요소가 포함되어 있어 썸네일/이미지 방향을 빠르게 시안화할 때 적합합니다. 실제 업로드 전 브랜드·가이드라인을 확인하세요.",
    promptExample: `/imagine youtube thumbnail, bold readable Korean title area, subject related to: ${topic}, high contrast, clean layout, soft studio lighting --ar 16:9`,
    effect:
      "썸네일 시안을 여러 버전으로 빠르게 뽑아 비교할 때 참고할 수 있습니다. 클릭이나 수치 개선을 보장하지는 않습니다.",
  };
}

function elevenLabs(item: ActionItem): ActionSmartAssist {
  const line = clip(item.reason, 120);
  return {
    toolName: "ElevenLabs",
    reason:
      "음성·나레이션 품질 개선이 필요한 액션으로 분류되었습니다. 톤·속도는 채널 페르소나에 맞게 조정하세요.",
    promptExample: `[스타일: 차분한 해설 톤, 한국어]\n첫 문장: ${line}`,
    effect:
      "나레이션 초안을 빠르게 들으며 길이·호흡을 맞출 수 있어, 편집 단계에서 반복 작업을 줄일 수 있습니다.",
  };
}

function vrew(item: ActionItem): ActionSmartAssist {
  return {
    toolName: "Vrew",
    reason:
      "편집·자막·컷 작업이 중심인 액션입니다. 자동 자막·무음 구간 제거 등으로 제작 시간을 줄이는 시나리오에 맞춥니다.",
    promptExample:
      "프로젝트에 클립을 넣은 뒤: 한국어 자동 자막 생성 → 무음/반복 구간 자동 컷 제안 → 내보내기 전 해상도·비트레이트는 채널 기본값 유지.",
    effect:
      "자막·컷 작업 시간을 줄이는 데 도움이 될 수 있는 보조입니다. 최종 결과는 반드시 확인하세요.",
  };
}

function chatGptSeo(item: ActionItem): ActionSmartAssist {
  const t = clip(item.title, 48);
  return {
    toolName: "문장 보조 도구",
    reason:
      "SEO·제목·태그·메타 방향의 액션입니다. 검색 의도와 채널 톤을 함께 넣어 한 번에 여러 후보를 비교할 수 있습니다.",
    promptExample: `역할: 한국어 YouTube SEO 어시스턴트.\n채널 액션: ${t}\n요청: 검색 의도에 맞는 제목 후보 5개(40자 내), 설명 첫 줄 1개, 태그 8개 이내.`,
    effect:
      "후보를 빠르게 늘려 실제 업로드 전 팀 내 검토·A/B 설계에 쓸 수 있습니다.",
  };
}

function genericLlm(item: ActionItem, area: ActionImpactArea): ActionSmartAssist {
  const ctx = clip(`${item.title}. ${item.reason}`, 200);
  return {
    toolName: "문장 보조 도구",
    reason: `영향 영역「${area}」에 맞춰 저장된 액션 문맥을 바탕으로 실행 문장·체크리스트 초안을 뽑을 때 사용합니다.`,
    promptExample: `다음은 우리 채널 액션 플랜의 한 항목입니다. 실행 가능한 5단계 체크리스트와 주의사항 3가지만 한국어로 정리해 주세요:\n\n${ctx}`,
    effect:
      "실행 단계를 글로 풀어내는 보조로 쓸 수 있습니다. 수치나 성과를 보장하지는 않습니다.",
  };
}

function areaFallback(area: ActionImpactArea, item: ActionItem): ActionSmartAssist {
  switch (area) {
    case "조회·도달":
      return midjourney(item);
    case "SEO·메타":
      return chatGptSeo(item);
    case "반응·참여":
      return {
        toolName: "문장 보조 도구",
        reason:
          "참여·CTA·질문 문구를 다듬는 액션에 맞춰 짧은 훅·댓글 유도 문장 초안을 뽑을 때 사용합니다.",
        promptExample: `액션: ${clip(item.title, 60)}\n요청: 영상 마지막 20초용 CTA 2안(한국어), 댓글 질문 1개.`,
        effect: "시청 이후 행동 문구를 초안으로 잡는 데 참고할 수 있습니다.",
      };
    case "업로드·일관성":
      return {
        toolName: "Notion / 캘린더 + 문장 보조",
        reason:
          "업로드 리듬·슬롯 고정이 중심일 때, 일정 문장화와 리마인드 문구를 함께 쓰기 좋습니다.",
        promptExample: `주간 업로드 목표를 ${clip(item.reason, 100)} 맥락에 맞게 2주 치 캘린더 불릿으로만 정리해 주세요.`,
        effect: "주간 일정을 글로 정리하는 보조로 쓸 수 있습니다.",
      };
    case "콘텐츠 구조":
      return {
        toolName: "Vrew",
        reason:
          "구조·포맷 정리가 중심일 때 자막·컷·길이 정렬로 형식을 맞추는 편이 유리합니다.",
        promptExample:
          "동일 포맷 템플릿(인트로 길이·본론 챕터 수)을 먼저 정한 뒤, Vrew에서 자막·무음 컷으로 맞춥니다.",
        effect: "형식을 맞추는 작업의 참고용으로 쓸 수 있습니다.",
      };
    case "성장·전략":
    default:
      return genericLlm(item, area);
  }
}

/**
 * 저장된 액션 제목·이유·영향 영역으로 도구 추천 문구를 만든다. 외부 API 호출 없음.
 */
export function buildActionSmartAssist(
  item: ActionItem,
  impactArea: ActionImpactArea
): ActionSmartAssist {
  const blob = `${item.title}\n${item.reason}`.toLowerCase();

  if (/썸네일|thumbnail|thumb/.test(blob)) {
    return midjourney(item);
  }
  if (
    /음성|나레이션|tts|목소리|더빙|eleven|보이스|voice|보이스오버|성우/.test(blob)
  ) {
    return elevenLabs(item);
  }
  if (/편집|자막|vrew|브이리|컷편집|편집\s*툴|영상\s*편집/.test(blob)) {
    return vrew(item);
  }
  if (/seo|태그|제목|키워드|메타|검색\s*유입|description/.test(blob)) {
    return chatGptSeo(item);
  }

  return areaFallback(impactArea, item);
}
