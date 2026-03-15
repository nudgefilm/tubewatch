import { redirect } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/app/AppShell";
import PageContainer from "@/components/app/PageContainer";
import { createClient } from "@/lib/supabase/server";

const quickHelpCards = [
  {
    title: "채널 등록 방법",
    description: "유튜브 채널 URL을 입력하여 간편하게 채널을 등록하세요",
    href: "/channels",
  },
  {
    title: "채널 분석은 어떻게 진행되나요?",
    description: "등록된 채널의 데이터를 기반으로 자동 분석이 진행됩니다",
    href: "/channels",
  },
  {
    title: "분석 결과는 어디서 확인하나요?",
    description: "채널 분석, 액션 플랜, SEO 랩, 벤치마크에서 확인할 수 있습니다",
    href: "/action-plan",
  },
  {
    title: "요금제와 이용 제한 안내",
    description: "현재 무료 플랜으로 최대 3개 채널까지 등록 가능합니다",
    href: "/billing",
  },
];

const faqItems = [
  {
    question: "채널은 몇 개까지 등록할 수 있나요?",
    answer: "기본적으로 최대 3개의 채널을 등록할 수 있습니다.",
  },
  {
    question: "채널 분석은 얼마나 자주 할 수 있나요?",
    answer: "분석 정책에 따라 일정 시간 이후 다시 요청할 수 있습니다.",
  },
  {
    question: "분석 결과는 어디에서 확인하나요?",
    answer: "채널 분석 페이지, 액션 플랜, SEO 랩, 벤치마크 페이지에서 확인할 수 있습니다.",
  },
  {
    question: "유튜브 채널 URL은 어떤 형식으로 입력해야 하나요?",
    answer: "@채널명, youtube.com/@채널명, youtube.com/channel/UCxxxx 형식을 지원합니다.",
  },
  {
    question: "로그인은 어떤 방식으로 진행되나요?",
    answer: "Google 계정으로 간편하게 로그인할 수 있습니다.",
  },
];

export default async function SupportPage(): Promise<JSX.Element> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  return (
    <AppShell
      title="고객 지원"
      description="TubeWatch 이용 방법과 자주 묻는 질문을 확인하세요."
    >
      <PageContainer>
        {/* Quick Help Cards */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">빠른 도움말</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {quickHelpCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="mb-2 font-semibold text-slate-900">{card.title}</h3>
                <p className="text-sm text-slate-600">{card.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">자주 묻는 질문</h2>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {faqItems.map((item, index) => (
              <div
                key={item.question}
                className={`p-5 ${index !== faqItems.length - 1 ? "border-b border-slate-200" : ""}`}
              >
                <h3 className="mb-2 font-medium text-slate-900">{item.question}</h3>
                <p className="text-sm text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">문의 안내</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-slate-600">
              서비스 이용 중 도움이 필요하면 아래 경로로 문의하세요.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="mb-1 font-medium text-slate-900">이메일 문의</p>
                <p className="text-sm text-slate-600">nudgefilm@gmail.com</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="mb-1 font-medium text-slate-900">운영 시간</p>
                <p className="text-sm text-slate-600">평일 10:00 - 18:00</p>
              </div>
            </div>
          </div>
        </section>
      </PageContainer>
    </AppShell>
  );
}
