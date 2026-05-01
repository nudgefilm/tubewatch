"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ExternalLink, Mail, CheckCircle2, Loader2, Link2, Copy, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── 타입 ─────────────────────────────────────────────────────────────────────

type ManusReportRow = {
  id: string;
  access_token: string;
  status: string;
  year_month: string;
  created_at: string;
  user_channel_id: string;
  user_channels: { channel_title: string | null; channel_url: string | null } | null;
};

type EnterpriseOrder = {
  id: string;
  source: string;
  inquiry_id: string | null;
  email: string;
  contact_phone: string | null;
  channel_url: string;
  portone_payment_id: string | null;
  amount_krw: number;
  consulting_plan_id: string | null;
  payment_status: string;
  status: string;
  email_sent: boolean;
  reports_issued: number;
  total_reports: number;
  completed_months: string[] | null;
  report_tokens: string[] | null;
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
  report_tokens: string[] | null;
  status: string;
  admin_note: string | null;
  created_at: string;
};

type B2CInquiry = {
  id: string;
  channel_name: string;
  channel_url: string;
  contact_email: string;
  concerns: string[] | null;
  concern_other: string | null;
  contact_phone: string | null;
  status: string;
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

// ─── 월별 완료 현황 ───────────────────────────────────────────────────────────

function MonthlyCompletions({ completedMonths }: { completedMonths: string[] }) {
  if (completedMonths.length === 0) return null;

  const currentMonth = new Date().toISOString().slice(0, 7);
  // 월별 발송 횟수 집계
  const counts: Record<string, number> = {};
  for (const m of completedMonths) counts[m] = (counts[m] ?? 0) + 1;

  const sortedMonths = Object.keys(counts).sort();

  return (
    <div className="flex flex-wrap gap-1">
      {sortedMonths.map((month) => {
        const isCurrent = month === currentMonth;
        const label = month.slice(5); // "MM"
        return (
          <span
            key={month}
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
              isCurrent
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : "bg-foreground/[0.06] text-muted-foreground"
            }`}
          >
            {label}월{counts[month] > 1 ? ` ×${counts[month]}` : ""} ✓
          </span>
        );
      })}
    </div>
  );
}

// ─── 날짜 포맷 ────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── 주문 행 ─────────────────────────────────────────────────────────────────

function ReportLinks({ order, onRefresh }: { order: EnterpriseOrder; onRefresh: () => void }) {
  const tokens: string[] = order.report_tokens ?? [];
  const [showInput, setShowInput] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function extractToken(raw: string) {
    // URL 전체 입력도 허용: tubewatch.kr/report/TOKEN 또는 channelreport.net/TOKEN
    const match = raw.match(/\/([^/]+)\s*$/);
    return match ? match[1].trim() : raw.trim();
  }

  async function handleLink() {
    const token = extractToken(inputVal);
    if (!token) return;
    setLinkLoading(true);
    setLinkError(null);
    try {
      const res = await fetch("/api/admin/enterprise/link-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, token }),
      });
      const data = await res.json();
      if (data.ok) {
        setInputVal("");
        setShowInput(false);
        onRefresh();
      } else {
        setLinkError(data.error ?? "연결 실패");
      }
    } finally {
      setLinkLoading(false);
    }
  }

  async function handleUnlink(token: string) {
    await fetch("/api/admin/enterprise/link-report", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, token }),
    });
    onRefresh();
  }

  function copyUrl(token: string) {
    const url = `https://channelreport.net/${token}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {tokens.map((token) => (
        <div key={token} className="flex items-center gap-1.5 rounded-md bg-foreground/[0.03] px-2 py-1">
          <a
            href={`https://channelreport.net/${token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate font-mono text-[10px] text-muted-foreground hover:text-foreground hover:underline"
          >
            channelreport.net/{token.slice(0, 16)}…
          </a>
          <button onClick={() => copyUrl(token)} className="text-muted-foreground hover:text-foreground" title="URL 복사">
            {copied === token ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </button>
          <button onClick={() => void handleUnlink(token)} className="text-muted-foreground hover:text-destructive" title="연결 해제">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {showInput ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <input
              className="h-7 flex-1 rounded border border-foreground/20 bg-background px-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-foreground/30"
              placeholder="access_token 또는 리포트 URL"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleLink(); }}
              autoFocus
            />
            <button
              onClick={() => void handleLink()}
              disabled={linkLoading || !inputVal.trim()}
              className="flex h-7 items-center rounded bg-foreground px-2 text-xs font-medium text-background disabled:opacity-40"
            >
              {linkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "연결"}
            </button>
            <button onClick={() => { setShowInput(false); setLinkError(null); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          {linkError && <p className="text-[10px] text-destructive">{linkError}</p>}
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <Link2 className="h-3 w-3" />
          리포트 연결
        </button>
      )}
    </div>
  );
}

function OrderRow({ order, onRefresh }: { order: EnterpriseOrder; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

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

  async function handleResend() {
    if (resendLoading) return;
    setResendLoading(true);
    try {
      const res = await fetch("/api/admin/enterprise/resend-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (data.ok) {
        onRefresh();
      } else {
        alert(`재발송 실패: ${data.reason ?? data.error ?? "알 수 없는 오류"}`);
      }
    } finally {
      setResendLoading(false);
    }
  }

  const canMarkSent = order.status !== "completed" && order.reports_issued < order.total_reports;
  const canResend = order.status === "paid" && order.email_sent;

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
          <ReportLinks order={order} onRefresh={onRefresh} />
        </div>
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap items-center gap-1">
          <StatusBadge status={order.status} />
          {order.source === "channelreport" && (
            <Badge variant="outline" className="text-xs">B2B</Badge>
          )}
          {order.consulting_plan_id && (
            <Badge variant="secondary" className="text-xs capitalize">{order.consulting_plan_id}</Badge>
          )}
        </div>
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">
            {order.reports_issued}/{order.total_reports}
          </span>
          <MonthlyCompletions completedMonths={order.completed_months ?? []} />
        </div>
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
          <Button size="sm" variant="outline" asChild>
            <a href={order.channel_url} target="_blank" rel="noopener noreferrer">
              채널 분석 시작
            </a>
          </Button>
          {canMarkSent && (
            <Button size="sm" onClick={markReportSent} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "발송 완료"}
            </Button>
          )}
          {canResend && (
            <Button size="sm" variant="outline" onClick={handleResend} disabled={resendLoading}>
              {resendLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : (
                <><Mail className="mr-1 h-3 w-3" />이메일 재발송</>
              )}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── B2B 문의 리포트 링크 ─────────────────────────────────────────────────────

function InquiryReportLinks({ inquiry, onRefresh }: { inquiry: B2BInquiry; onRefresh: () => void }) {
  const tokens: string[] = inquiry.report_tokens ?? [];
  const [showInput, setShowInput] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function extractToken(raw: string) {
    const match = raw.match(/\/([^/]+)\s*$/);
    return match ? match[1].trim() : raw.trim();
  }

  async function handleLink() {
    const token = extractToken(inputVal);
    if (!token) return;
    setLinkLoading(true);
    setLinkError(null);
    try {
      const res = await fetch("/api/admin/enterprise/link-inquiry-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryId: inquiry.id, token }),
      });
      const data = await res.json();
      if (data.ok) { setInputVal(""); setShowInput(false); onRefresh(); }
      else setLinkError(data.error ?? "연결 실패");
    } finally { setLinkLoading(false); }
  }

  async function handleUnlink(token: string) {
    await fetch("/api/admin/enterprise/link-inquiry-report", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inquiryId: inquiry.id, token }),
    });
    onRefresh();
  }

  function copyUrl(token: string) {
    const url = `https://channelreport.net/${token}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      {tokens.map((token) => (
        <div key={token} className="flex items-center gap-1.5 rounded-md bg-foreground/[0.03] px-2 py-1">
          <a
            href={`https://channelreport.net/${token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate font-mono text-[10px] text-muted-foreground hover:text-foreground hover:underline"
          >
            channelreport.net/{token.slice(0, 16)}…
          </a>
          <button onClick={() => copyUrl(token)} className="text-muted-foreground hover:text-foreground" title="URL 복사">
            {copied === token ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </button>
          <button onClick={() => void handleUnlink(token)} className="text-muted-foreground hover:text-destructive" title="연결 해제">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {showInput ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <input
              className="h-7 flex-1 rounded border border-foreground/20 bg-background px-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-foreground/30"
              placeholder="access_token 또는 리포트 URL"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleLink(); }}
              autoFocus
            />
            <button
              onClick={() => void handleLink()}
              disabled={linkLoading || !inputVal.trim()}
              className="flex h-7 items-center rounded bg-foreground px-2 text-xs font-medium text-background disabled:opacity-40"
            >
              {linkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "연결"}
            </button>
            <button onClick={() => { setShowInput(false); setLinkError(null); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          {linkError && <p className="text-[10px] text-destructive">{linkError}</p>}
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <Link2 className="h-3 w-3" />
          리포트 연결
        </button>
      )}
    </div>
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
        <div className="flex flex-col gap-2">
          {inquiry.status === "new" && (
            <Button size="sm" onClick={sendPaymentLink} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : (
                <><Mail className="mr-1 h-3 w-3" />결제 안내 발송</>
              )}
            </Button>
          )}
          <InquiryReportLinks inquiry={inquiry} onRefresh={onRefresh} />
        </div>
      </td>
    </tr>
  );
}

// ─── B2C 신청 행 ──────────────────────────────────────────────────────────────

function B2CRow({ inquiry }: { inquiry: B2CInquiry }) {
  const allConcerns = [
    ...(inquiry.concerns ?? []),
    ...(inquiry.concern_other ? [`기타: ${inquiry.concern_other}`] : []),
  ];

  return (
    <tr className="border-b border-foreground/5 hover:bg-foreground/[0.02]">
      <td className="py-3 pl-0 pr-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{inquiry.channel_name}</span>
          <a
            href={inquiry.channel_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:underline"
          >
            {inquiry.channel_url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 30)}
            <ExternalLink className="h-3 w-3" />
          </a>
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
        {allConcerns.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {allConcerns.map((c) => (
              <span key={c} className="text-xs text-muted-foreground">{c}</span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3 pr-4">
        <Badge variant={inquiry.status === "new" ? "outline" : "secondary"}>
          {inquiry.status === "new" ? "접수" : inquiry.status === "payment_sent" ? "안내 발송" : inquiry.status}
        </Badge>
      </td>
      <td className="py-3 text-xs text-muted-foreground">{fmtDate(inquiry.created_at)}</td>
    </tr>
  );
}

// ─── 리포트 목록 뷰 ───────────────────────────────────────────────────────────

function ReportsTab({ reports }: { reports: ManusReportRow[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  function copyToken(token: string) {
    void navigator.clipboard.writeText(`https://channelreport.net/${token}`).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  if (reports.length === 0) {
    return <p className="text-sm text-muted-foreground">생성된 리포트가 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-foreground/10 text-xs text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">채널</th>
            <th className="pb-2 pr-4 font-medium">상태</th>
            <th className="pb-2 pr-4 font-medium">발행월</th>
            <th className="pb-2 pr-4 font-medium">생성일</th>
            <th className="pb-2 font-medium">리포트 URL</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id} className="border-b border-foreground/5 hover:bg-foreground/[0.02]">
              <td className="py-3 pr-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {r.user_channels?.channel_title ?? "—"}
                  </span>
                  {r.user_channels?.channel_url && (
                    <a
                      href={r.user_channels.channel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                    >
                      {r.user_channels.channel_url.replace("https://www.youtube.com/", "").slice(0, 28)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </td>
              <td className="py-3 pr-4">
                <Badge variant={r.status === "completed" ? "default" : r.status === "processing" ? "outline" : "destructive"}>
                  {r.status === "completed" ? "완료" : r.status === "processing" ? "생성 중" : r.status}
                </Badge>
              </td>
              <td className="py-3 pr-4 text-sm">{r.year_month}</td>
              <td className="py-3 pr-4 text-xs text-muted-foreground">{fmtDate(r.created_at)}</td>
              <td className="py-3">
                {r.status === "completed" ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://channelreport.net/${r.access_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                    >
                      /{r.access_token.slice(0, 16)}…
                    </a>
                    <button
                      onClick={() => copyToken(r.access_token)}
                      className="text-muted-foreground hover:text-foreground"
                      title="URL 복사"
                    >
                      {copied === r.access_token
                        ? <Check className="h-3 w-3 text-green-500" />
                        : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── 메인 뷰 ─────────────────────────────────────────────────────────────────

export default function EnterpriseOrdersView({
  orders,
  inquiries,
  b2cInquiries = [],
  reports = [],
}: {
  orders: EnterpriseOrder[];
  inquiries: B2BInquiry[];
  b2cInquiries?: B2CInquiry[];
  reports?: ManusReportRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"orders" | "inquiries" | "b2c" | "reports">("orders");

  function refresh() {
    router.refresh();
  }

  const tabs = [
    { id: "orders" as const,    label: `주문 내역 (${orders.length})` },
    { id: "inquiries" as const, label: `B2B 문의 (${inquiries.length})` },
    { id: "b2c" as const,       label: `B2C 신청 (${b2cInquiries.length})` },
    { id: "reports" as const,   label: `리포트 목록 (${reports.length})` },
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

      {/* 리포트 목록 */}
      {tab === "reports" && <ReportsTab reports={reports} />}

      {/* B2C 신청 목록 */}
      {tab === "b2c" && (
        b2cInquiries.length === 0 ? (
          <p className="text-sm text-muted-foreground">접수된 B2C 신청이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-foreground/10 text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">채널명 / URL</th>
                  <th className="pb-2 pr-4 font-medium">이메일 / 연락처</th>
                  <th className="pb-2 pr-4 font-medium">고민 항목</th>
                  <th className="pb-2 pr-4 font-medium">상태</th>
                  <th className="pb-2 font-medium">접수일</th>
                </tr>
              </thead>
              <tbody>
                {b2cInquiries.map((i) => (
                  <B2CRow key={i.id} inquiry={i} />
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
