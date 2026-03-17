"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Zap,
  FileText,
  Search,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Circle,
  Target,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import type { ActionPlanPageData, ActionItem } from "./types";

type ActionPlanZipViewProps = {
  data: ActionPlanPageData | null;
};

type SummaryData = {
  status: string;
  urgentPoint: string;
  priority: string;
};

type PriorityActionView = {
  id: number;
  title: string;
  description: string;
  expectedEffect: string;
  difficulty: string;
  timing: string;
};

const categoryActions = {
  content: {
    title: "콘텐츠",
    icon: FileText,
    items: [
      "인기 영상 포맷을 기반으로 시리즈 기획하기",
      "영상 길이를 8~12분으로 조정하기",
      "인트로 10초 내 핵심 내용 전달하기",
    ],
  },
  seo: {
    title: "SEO",
    icon: Search,
    items: [
      "제목에 검색 키워드 포함하기",
      "설명란 첫 2줄에 핵심 내용 작성하기",
      "태그 10~15개 설정하기",
    ],
  },
  upload: {
    title: "업로드 운영",
    icon: Calendar,
    items: [
      "고정 업로드 요일 설정하기",
      "업로드 간격 7일 이내 유지하기",
      "최적 업로드 시간대 분석 및 적용하기",
    ],
  },
  engagement: {
    title: "시청자 반응",
    icon: MessageSquare,
    items: [
      "댓글에 24시간 내 답변하기",
      "영상 중 시청자 참여 유도 질문 넣기",
      "커뮤니티 게시판 주 1회 이상 활용하기",
    ],
  },
};

const quickChecklistInitial = [
  { id: 1, text: "다음 영상 제목에 핵심 키워드 포함하기", checked: false },
  { id: 2, text: "설명란 첫 줄에 주제 명확히 넣기", checked: false },
  { id: 3, text: "업로드 간격 7일 이내 유지하기", checked: false },
  { id: 4, text: "썸네일에 텍스트 3단어 이내로 넣기", checked: false },
  { id: 5, text: "영상 끝에 다음 영상 예고하기", checked: false },
];

function buildSummaryData(data: ActionPlanPageData | null): SummaryData {
  const latest = data?.latestResult;

  const status =
    (latest?.channel_summary &&
      typeof latest.channel_summary === "string" &&
      latest.channel_summary.trim().length > 0
      ? latest.channel_summary.trim()
      : "현재 채널은 기본 구조는 갖추고 있지만, 업로드 규칙성과 SEO 최적화 개선이 필요합니다.") ?? "";

  const urgentPointSource =
    Array.isArray(latest?.weaknesses) && latest.weaknesses.length > 0
      ? latest.weaknesses[0]
      : null;

  const urgentPoint =
    urgentPointSource && urgentPointSource.trim().length > 0
      ? urgentPointSource.trim()
      : "업로드 주기가 불규칙합니다 (평균 14일)";

  const priority =
    "콘텐츠 일관성 확보 후 SEO 개선을 우선순위로 두는 것이 좋습니다.";

  return {
    status,
    urgentPoint,
    priority,
  };
}

function mapActionsToPriority(actions: ActionItem[]): PriorityActionView[] {
  const difficultyByIndex: Record<number, string> = {
    0: "쉬움",
    1: "보통",
    2: "보통",
  };

  const timingByIndex: Record<number, string> = {
    0: "즉시 실행",
    1: "이번 주",
    2: "다음 단계",
  };

  return actions.slice(0, 3).map((action, index) => ({
    id: index + 1,
    title: action.title,
    description: action.reason,
    expectedEffect: action.expected_impact,
    difficulty: difficultyByIndex[index] ?? "보통",
    timing: timingByIndex[index] ?? "다음 단계",
  }));
}

function getDifficultyColor(difficulty: string): string {
  if (difficulty === "쉬움") return "bg-emerald-100 text-emerald-700";
  if (difficulty === "어려움") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

function SummaryCard({ summary }: { summary: SummaryData }): JSX.Element {
  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Lightbulb className="size-5 text-primary" />
          </div>
          <CardTitle>현재 채널 상태 요약</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{summary.status}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-background p-3">
            <p className="text-xs font-medium text-muted-foreground">
              가장 시급한 개선 포인트
            </p>
            <p className="mt-1 font-medium text-rose-600">{summary.urgentPoint}</p>
          </div>
          <div className="rounded-lg bg-background p-3">
            <p className="text-xs font-medium text-muted-foreground">
              추천 우선순위
            </p>
            <p className="mt-1 font-medium">{summary.priority}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PriorityActionCard({
  action,
  index,
}: {
  action: PriorityActionView;
  index: number;
}): JSX.Element {
  return (
    <Card className="hover-lift">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
              {index + 1}
            </div>
            <CardTitle className="text-lg">{action.title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{action.description}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="size-4 text-emerald-600" />
            <span className="text-muted-foreground">기대 효과:</span>
            <span>{action.expectedEffect}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={getDifficultyColor(action.difficulty)}>
            난이도: {action.difficulty}
          </Badge>
          <Badge variant="outline">{action.timing}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function CategorySection({
  category,
}: {
  category: (typeof categoryActions.content) & { key: string };
}): JSX.Element {
  const Icon = category.icon;
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-5" />
          </div>
          <CardTitle className="text-base">{category.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {category.items.map((item, index) => (
            <li
              key={`${category.key}-${index}`}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function QuickChecklistCard(): JSX.Element {
  const [items, setItems] = useState(quickChecklistInitial);

  const toggleItem = (id: number): void => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Target className="size-5" />
          </div>
          <div>
            <CardTitle>바로 실행할 항목</CardTitle>
            <CardDescription>오늘 당장 시작할 수 있는 액션들</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
              >
                {item.checked ? (
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="size-5 shrink-0 text-muted-foreground" />
                )}
                <span
                  className={
                    item.checked
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }
                >
                  {item.text}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ActionPlanEmptyZip(): JSX.Element {
  return (
    <Empty className="min-h-[400px] border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Zap className="size-6" />
        </EmptyMedia>
        <EmptyTitle>아직 분석 결과가 없습니다</EmptyTitle>
        <EmptyDescription>
          채널 분석을 먼저 완료하면 액션 플랜을 확인할 수 있습니다
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/channels">
            채널 분석하러 가기
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export default function ActionPlanZipView({
  data,
}: ActionPlanZipViewProps): JSX.Element {
  const hasAnalysisData =
    data !== null && data.channels.length > 0 && data.latestResult !== null;

  const priorityActions = hasAnalysisData
    ? mapActionsToPriority(data.actions)
    : [];

  const summary = buildSummaryData(data);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-6 lg:px-10 lg:py-8">
        <div className="mb-8">
          <h1 className="font-display flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Zap className="size-6" />
            액션 플랜
          </h1>
          <p className="mt-1 text-muted-foreground">
            분석 결과를 바탕으로 지금 실행해야 할 우선순위 액션을 확인하세요
          </p>
        </div>

        {!hasAnalysisData ? (
          <ActionPlanEmptyZip />
        ) : (
          <div className="space-y-8">
            <SummaryCard summary={summary} />

            <section>
            <h2 className="mb-4 text-xl font-display font-semibold">우선순위 액션</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {priorityActions.map((action, index) => (
                  <PriorityActionCard
                    key={action.id}
                    action={action}
                    index={index}
                  />
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-display font-semibold">카테고리별 액션</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(categoryActions).map(([key, category]) => (
                  <CategorySection
                    key={key}
                    category={{ ...category, key }}
                  />
                ))}
              </div>
            </section>

            <section>
              <QuickChecklistCard />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

