"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type DiagnoseLead = {
  id: string;
  channel_url: string;
  contact_email: string;
  status: string;
  report_token: string | null;
  created_at: string;
};

export default function DiagnoseLeadsView({ leads }: { leads: DiagnoseLead[] }) {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">채널 무료 진단 리드</h1>
      {leads.length === 0 ? (
        <p className="text-muted-foreground text-sm">신청 내역이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <LeadRow key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}

function LeadRow({ lead }: { lead: DiagnoseLead }) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"sent" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [sent, setSent] = useState(lead.status === "report_sent");

  async function handleSend() {
    if (!token.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/diagnose-leads/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, reportToken: token.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? "오류가 발생했습니다.");
        setResult("error");
      } else {
        setResult("sent");
        setSent(true);
      }
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
      setResult("error");
    } finally {
      setLoading(false);
    }
  }

  const date = new Date(lead.created_at).toLocaleString("ko-KR", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="rounded-xl border border-foreground/10 bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <a
            href={lead.channel_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-foreground hover:underline break-all"
          >
            {lead.channel_url}
          </a>
          <p className="text-xs text-muted-foreground">{lead.contact_email}</p>
          <p className="text-xs text-muted-foreground/60">{date}</p>
        </div>
        <Badge
          variant="outline"
          className={sent
            ? "text-emerald-600 border-emerald-500/40 shrink-0"
            : "text-amber-600 border-amber-500/40 shrink-0"}
        >
          {sent ? "발송 완료" : "대기 중"}
        </Badge>
      </div>

      {!sent && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="리포트 URL 또는 토큰 입력"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="text-xs h-8 font-mono"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={loading || !token.trim()}
            className="shrink-0"
          >
            {loading ? "발송 중…" : "리포트 발송"}
          </Button>
        </div>
      )}

      {result === "sent" && (
        <p className="text-xs text-emerald-600">리포트 이메일이 발송됐습니다.</p>
      )}
      {result === "error" && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}
      {sent && lead.report_token && (
        <p className="text-xs text-muted-foreground/60 font-mono">
          token: {lead.report_token}
        </p>
      )}
    </div>
  );
}
