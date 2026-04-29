"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ExternalLink, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── 타입 ─────────────────────────────────────────────────────────────────────

type EnterpriseOrder = {
  id: string;
  source: string;
  inquiry_id: string | null;
  email: string;
  contact_phone: string | null;
  channel_url: string;
  portone_payment_id: string | null;
  amount_krw: number;
  payment_status: string;
  status: string;
  reports_issued: number;
  total_reports: number;
  tax_invoice_requested: boolean;
  tax_invoice_issued: boolean;
  admin_note: string | null;
  created_at: string;
};

type B2BInquiry = {
  id: string;
  agency_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  channel_url: string;
  tax_invoice_requested: boolean;
  tax_invoice_info: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
};

// ─── 상태 뱃지 ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  inquiry_received:  { label: "문의 접수",   variant: "secondary" },
  payment_pending:   { label: "결제 대기",   variant: "outline" },
  paid:              { label: "결제 완료",   variant: "default" },
  analysis_progress: { label: "분석 중",     variant: "default" },
  completed:         { label: "완료",        variant: "secondary" },
  failed:            { label: "실패",        variant: "destructive" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

// ─── 날짜 포맷 ────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── 주문 행 ─────────────────────────────────────────────────────────────────

function OrderRow({ order, onRefresh }: { order: EnterpriseOrder; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);

  async function markReportSent() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/admin/enterprise/mark-report-sent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  async function toggleTaxInvoice() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/admin/enterprise/toggle-tax-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, issued: !order.tax_invoice_issued }),
      });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  const canMarkSent = order.status !== "completed" && order.reports_issued < order.total_reports;

  return (
    <tr className="border-b border-foreground/5 hover:bg-foreground/[0.02]">
      <td className="py-3 pl-0 pr-4">
        <div className="flex flex-col gap-0.5">
          <a
            href={order.channel_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
          >
            {order.channel_url.replace("https://www.youtube.com/", "").slice(0, 30)}
            <ExternalLink className="h-3 w-3" />
          </a>
          <span className="text-xs text-muted-foreground">{order.email}</span>
          {order.contact_phone && (
            <span className="text-xs text-muted-foreground">{order.contact_phone}</span>
          )}
        </div>
      </td>
      <td className="py-3 pr-4">
        <StatusBadge status={order.status} />
        {order.source === "channelreport" && (
          <Badge variant="outline" className="ml-1 text-xs">B2B</Badge>
        )}
      </td>
      <td className="py-3 pr-4">
        <span className="text-sm font-semibold">
          {order.reports_issued}/{order.total_reports}
        </span>
      </td>
      <td className="py-3 pr-4">
        {order.tax_invoice_requested ? (
          <button
            onClick={toggleTaxInvoice}
            className="flex items-center gap-1 text-xs"
            disabled={loading}
          >
            <CheckCircle2 className={`h-4 w-4 ${order.tax_invoice_issued ? "text-green-500" : "text-muted-foreground"}`} />
            {order.tax_invoice_issued ? "발행 완료" : "발행 요청"}
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3 pr-4 text-xs text-muted-foreground">{fmtDate(order.created_at)}</td>
      <td className="py-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            asChild
          >
            <a href={order.channel_url} target="_blank" rel="noopener noreferrer">
              채널 분석 시작
            </a>
          </Button>
          {canMarkSent && (
            <Button size="sm" onClick={markReportSent} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "발송 완료"}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── B2B 문의 행 ──────────────────────────────────────────────────────────────

function InquiryRow({ inquiry, onRefresh }: { inquiry: B2BInquiry; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);

  async function sendPaymentLink() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/admin/enterprise/send-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryId: inquiry.id }),
      });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <tr className="border-b border-foreground/5 hover:bg-foreground/[0.02]">
      <td className="py-3 pl-0 pr-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{inquiry.agency_name}</span>
          <span className="text-xs text-muted-foreground">{inquiry.contact_name}</span>
        </div>
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm">{inquiry.contact_email}</span>
          {inquiry.contact_phone && (
            <span className="text-xs text-muted-foreground">{inquiry.contact_phone}</span>
          )}
        </div>
      </td>
      <td className="py-3 pr-4">
        <a
          href={inquiry.channel_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm hover:underline"
        >
          {inquiry.channel_url.replace("https://www.youtube.com/", "").slice(0, 28)}
          <ExternalLink className="h-3 w-3" />
        </a>
      </td>
      <td className="py-3 pr-4">
        <Badge variant={inquiry.status === "new" ? "outline" : "secondary"}>
          {inquiry.status === "new" ? "접수" : inquiry.status === "payment_sent" ? "안내 발송" : inquiry.status}
        </Badge>
        {inquiry.tax_invoice_requested && (
          <Badge variant="outline" className="ml-1 text-xs">세금계산서</Badge>
        )}
      </td>
      <td className="py-3 pr-4 text-xs text-muted-foreground">{fmtDate(inquiry.created_at)}</td>
      <td className="py-3">
        {inquiry.status === "new" && (
          <Button size="sm" onClick={sendPaymentLink} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : (
              <><Mail className="mr-1 h-3 w-3" />결제 안내 발송</>
            )}
          </Button>
        )}
      </td>
    </tr>
  );
}

// ─── 메인 뷰 ─────────────────────────────────────────────────────────────────

export default function EnterpriseOrdersView({
  orders,
  inquiries,
}: {
  orders: EnterpriseOrder[];
  inquiries: B2BInquiry[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"orders" | "inquiries">("orders");

  function refresh() {
    router.refresh();
  }

  const tabs = [
    { id: "orders" as const,    label: `주문 내역 (${orders.length})` },
    { id: "inquiries" as const, label: `B2B 문의 (${inquiries.length})` },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Building2 className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">채널 컨설팅 주문</h1>
      </div>

      {/* 탭 */}
      <div className="mb-6 flex gap-1 border-b border-foreground/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              "px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 주문 목록 */}
      {tab === "orders" && (
        orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">주문 내역이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-foreground/10 text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">채널 / 이메일</th>
                  <th className="pb-2 pr-4 font-medium">상태</th>
                  <th className="pb-2 pr-4 font-medium">발행 횟수</th>
                  <th className="pb-2 pr-4 font-medium">세금계산서</th>
                  <th className="pb-2 pr-4 font-medium">주문일</th>
                  <th className="pb-2 font-medium">액션</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <OrderRow key={o.id} order={o} onRefresh={refresh} />
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* B2B 문의 목록 */}
      {tab === "inquiries" && (
        inquiries.length === 0 ? (
          <p className="text-sm text-muted-foreground">접수된 B2B 문의가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-foreground/10 text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">기관명 / 담당자</th>
                  <th className="pb-2 pr-4 font-medium">이메일 / 연락처</th>
                  <th className="pb-2 pr-4 font-medium">채널 URL</th>
                  <th className="pb-2 pr-4 font-medium">상태</th>
                  <th className="pb-2 pr-4 font-medium">접수일</th>
                  <th className="pb-2 font-medium">액션</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((i) => (
                  <InquiryRow key={i.id} inquiry={i} onRefresh={refresh} />
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
