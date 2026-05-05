import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "nudgefilm@gmail.com";
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@tubewatch.kr";

export async function sendEnterpriseOrderAlert({
  orderId,
  channelUrl,
  email,
  contactPhone,
  source,
  inquiryId,
}: {
  orderId: string;
  channelUrl: string;
  email: string;
  contactPhone?: string | null;
  source: string;
  inquiryId?: string | null;
}) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `[채널 컨설팅 신규 주문] ${source === "channelreport" ? "ChannelReport B2B" : "TubeWatch 직접"} — ${email}`,
    html: `
      <h2>채널 컨설팅 신규 주문</h2>
      <table>
        <tr><td><b>주문 ID</b></td><td>${orderId}</td></tr>
        <tr><td><b>경로</b></td><td>${source}</td></tr>
        <tr><td><b>채널 URL</b></td><td><a href="${channelUrl}">${channelUrl}</a></td></tr>
        <tr><td><b>이메일</b></td><td>${email}</td></tr>
        <tr><td><b>연락처</b></td><td>${contactPhone ?? "—"}</td></tr>
        ${inquiryId ? `<tr><td><b>문의 ID</b></td><td>${inquiryId}</td></tr>` : ""}
      </table>
      <p><a href="https://www.tubewatch.kr/admin/enterprise-orders">어드민에서 확인하기</a></p>
    `,
  });
}

export async function sendB2BInquiryAlert({
  inquiryId,
  agencyName,
  contactName,
  contactEmail,
  contactPhone,
  channelUrl,
  taxInvoiceRequested,
}: {
  inquiryId: string;
  agencyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  channelUrl: string;
  taxInvoiceRequested: boolean;
}) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `[ChannelReport B2B 문의] ${agencyName} — ${contactEmail}`,
    html: `
      <h2>ChannelReport B2B 신규 문의</h2>
      <table>
        <tr><td><b>문의 ID</b></td><td>${inquiryId}</td></tr>
        <tr><td><b>기관명</b></td><td>${agencyName}</td></tr>
        <tr><td><b>담당자</b></td><td>${contactName}</td></tr>
        <tr><td><b>이메일</b></td><td>${contactEmail}</td></tr>
        <tr><td><b>연락처</b></td><td>${contactPhone ?? "—"}</td></tr>
        <tr><td><b>채널 URL</b></td><td><a href="${channelUrl}">${channelUrl}</a></td></tr>
        <tr><td><b>세금계산서 요청</b></td><td>${taxInvoiceRequested ? "예" : "아니오"}</td></tr>
      </table>
      <p><a href="https://www.tubewatch.kr/admin/enterprise-orders">어드민에서 결제 안내 발송하기</a></p>
    `,
  });
}

export async function sendPaymentLinkEmail({
  to,
  agencyName,
  channelUrl,
  inquiryId,
}: {
  to: string;
  agencyName: string;
  channelUrl: string;
  inquiryId: string;
}) {
  const paymentUrl = `https://www.tubewatch.kr/billing?enterprise=1&inquiry_id=${inquiryId}&channel_url=${encodeURIComponent(channelUrl)}`;
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "채널 컨설팅 서비스 결제 안내 — Channel Report",
    html: `
      <h2>${agencyName} 담당자님께</h2>
      <p>채널 컨설팅 서비스(Enterprise Standard) 신청을 접수했습니다.</p>
      <p>아래 링크에서 결제를 진행해 주세요.</p>
      <p style="color:#e85c00;font-size:13px;font-weight:600;">※ 결제 페이지는 Google 계정 로그인이 필요합니다. Google 이메일로 접속해 주세요.</p>
      <br>
      <p><a href="${paymentUrl}" style="background:#000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">결제하기 (₩330,000)</a></p>
      <br>
      <p style="color:#888;font-size:12px;">분석 대상 채널: ${channelUrl}</p>
      <p style="font-size:14px;font-weight:bold;">ChannelReport</p>
    `,
  });
}

export async function sendPaymentReceiptEmail({
  to,
  type,
  planName,
  billingPeriod,
  creditCount,
  amountKrw,
  renewalAt,
}: {
  to: string;
  type: "subscription" | "credit";
  planName?: string;
  billingPeriod?: "monthly" | "semiannual";
  creditCount?: number;
  amountKrw: number;
  renewalAt?: string;
}) {
  const periodLabel = billingPeriod === "semiannual" ? "6개월" : "1개월";
  const subject =
    type === "subscription"
      ? `[TubeWatch] ${planName} 구독 결제 완료`
      : "[TubeWatch] 분석 크레딧 결제 완료";

  const html =
    type === "subscription"
      ? `
        <h2>${planName} 구독이 시작됐습니다.</h2>
        <table>
          <tr><td><b>플랜</b></td><td>${planName} (${periodLabel})</td></tr>
          <tr><td><b>결제 금액</b></td><td>₩${amountKrw.toLocaleString("ko-KR")}</td></tr>
          ${renewalAt ? `<tr><td><b>갱신일</b></td><td>${new Date(renewalAt).toLocaleDateString("ko-KR")}</td></tr>` : ""}
        </table>
        <p><a href="https://www.tubewatch.kr/billing">구독 관리하기</a></p>
      `
      : `
        <h2>분석 크레딧이 충전됐습니다.</h2>
        <table>
          <tr><td><b>충전 크레딧</b></td><td>${creditCount}회</td></tr>
          <tr><td><b>결제 금액</b></td><td>₩${amountKrw.toLocaleString("ko-KR")}</td></tr>
        </table>
        <p><a href="https://www.tubewatch.kr/analysis">분석 시작하기</a></p>
      `;

  await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
}

export async function sendEnterpriseOrderConfirmation({
  to,
  channelUrl,
  orderId,
}: {
  to: string;
  channelUrl: string;
  orderId: string;
}) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "[Channel Report] 채널 컨설팅 서비스 결제 완료",
    html: `
      <h2>채널 컨설팅 서비스 신청이 완료됐습니다.</h2>
      <p>분석 대상 채널: <a href="${channelUrl}">${channelUrl}</a></p>
      <p>담당자가 분석을 시작합니다. 완료 시 이메일로 안내드립니다.</p>
      <p style="color:#888;font-size:12px;">주문 번호: ${orderId}</p>
    `,
  });
}

export async function sendB2CConsultingAlert({
  inquiryId,
  channelName,
  channelUrl,
  contactEmail,
  concerns,
  concernOther,
  contactPhone,
}: {
  inquiryId: string;
  channelName: string;
  channelUrl: string;
  contactEmail: string;
  concerns: string[];
  concernOther?: string | null;
  contactPhone?: string | null;
}) {
  const concernsList = [
    ...concerns,
    ...(concernOther ? [`기타: ${concernOther}`] : []),
  ].join(", ") || "—";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `[B2C 컨설팅 신청] ${channelName} — ${contactEmail}`,
    html: `
      <h2>채널 데이터 컨설팅 B2C 신규 신청</h2>
      <table>
        <tr><td><b>신청 ID</b></td><td>${inquiryId}</td></tr>
        <tr><td><b>채널명</b></td><td>${channelName}</td></tr>
        <tr><td><b>채널 URL</b></td><td><a href="${channelUrl}">${channelUrl}</a></td></tr>
        <tr><td><b>이메일</b></td><td>${contactEmail}</td></tr>
        <tr><td><b>고민 항목</b></td><td>${concernsList}</td></tr>
        <tr><td><b>연락처</b></td><td>${contactPhone ?? "—"}</td></tr>
      </table>
      <p><a href="https://www.tubewatch.kr/admin/enterprise-orders">어드민에서 확인하기</a></p>
    `,
  });
}

export async function sendB2CConsultingPaymentLink({
  to,
  channelName,
  channelUrl,
}: {
  to: string;
  channelName: string;
  channelUrl: string;
}) {
  const paymentUrl = `https://www.tubewatch.kr/billing?enterprise=1&channel_url=${encodeURIComponent(channelUrl)}`;
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "[TubeWatch] 채널 데이터 컨설팅 결제 안내",
    html: `
      <h2>${channelName} 채널 운영자님께</h2>
      <p>채널 데이터 컨설팅 신청을 접수했습니다.</p>
      <p>아래 링크에서 컨설팅 플랜을 선택하고 결제를 진행해 주세요.</p>
      <p style="color:#e85c00;font-size:13px;font-weight:600;">※ 결제 페이지는 Google 계정 로그인이 필요합니다. Google 이메일로 접속해 주세요.</p>
      <br>
      <p><a href="${paymentUrl}" style="background:#000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">컨설팅 플랜 선택 및 결제하기</a></p>
      <br>
      <p style="color:#888;font-size:12px;">신청 채널: ${channelUrl}</p>
      <p style="font-size:14px;font-weight:bold;">TubeWatch</p>
    `,
  });
}

export async function sendReportReadyEmail({
  to,
  channelUrl,
  reportNumber,
  totalReports,
}: {
  to: string;
  channelUrl: string;
  reportNumber: number;
  totalReports: number;
}) {
  const subject =
    totalReports > 1
      ? `[Channel Report] ${reportNumber}차 전략 리포트가 도착했습니다`
      : "[Channel Report] 채널 전략 리포트가 도착했습니다";

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: `
      <h2>${reportNumber}차 리포트가 발송됐습니다.</h2>
      <p>분석 대상 채널: <a href="${channelUrl}">${channelUrl}</a></p>
      <p>첨부된 리포트를 확인해주세요. 추가 문의는 이 이메일로 회신해주세요.</p>
      ${totalReports > 1 ? `<p style="color:#888;font-size:12px;">${reportNumber} / ${totalReports}회 완료</p>` : ""}
    `,
  });
}

export async function sendB2CReportReadyEmail({
  to,
  channelName,
  channelUrl,
  reportToken,
}: {
  to: string;
  channelName: string;
  channelUrl: string;
  reportToken: string;
}) {
  const reportUrl = `https://channelreport.net/${reportToken}`;
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "[Channel Report] 채널 컨설팅 리포트가 도착했습니다",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
        <h2 style="font-size:18px;font-weight:700;margin-bottom:8px;">${channelName} 채널 리포트가 준비됐습니다.</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;">
          신청하신 채널(<a href="${channelUrl}" style="color:#e85c00;">${channelUrl}</a>)의 컨설팅 리포트를 확인해보세요.
        </p>
        <p style="margin-top:20px;">
          <a href="${reportUrl}" style="background:#000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:14px;">
            리포트 확인하기 →
          </a>
        </p>
        <p style="color:#aaa;font-size:11px;margin-top:24px;">Channel Report — 채널 데이터 컨설팅 서비스</p>
      </div>
    `,
  });
}

export async function sendDiagnoseLeadConfirmation({
  to,
  channelUrl,
}: {
  to: string;
  channelUrl: string;
}) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "[TubeWatch] 채널 무료 진단 신청이 접수됐습니다",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
        <h2 style="font-size:18px;font-weight:700;margin-bottom:8px;">채널 무료 진단 신청이 접수됐습니다.</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;">
          신청하신 채널(<a href="${channelUrl}" style="color:#e85c00;">${channelUrl}</a>)을 TubeWatch™ 팀이 직접 분석합니다.<br>
          <strong>24시간 내</strong>에 분석 리포트를 이 이메일로 발송해 드립니다.
        </p>
        <p style="color:#888;font-size:12px;margin-top:24px;">TubeWatch™ — YouTube 채널 정밀 분석 서비스</p>
      </div>
    `,
  });
}

export async function sendDiagnoseLeadAlert({
  leadId,
  channelUrl,
  contactEmail,
}: {
  leadId: string;
  channelUrl: string;
  contactEmail: string;
}) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `[무료 진단 신청] ${contactEmail} — ${channelUrl}`,
    html: `
      <h2>채널 무료 진단 신규 신청</h2>
      <table>
        <tr><td><b>리드 ID</b></td><td>${leadId}</td></tr>
        <tr><td><b>채널 URL</b></td><td><a href="${channelUrl}">${channelUrl}</a></td></tr>
        <tr><td><b>이메일</b></td><td>${contactEmail}</td></tr>
      </table>
      <p><a href="https://www.tubewatch.kr/admin/diagnose-leads">어드민에서 리포트 발송하기</a></p>
    `,
  });
}

export async function sendDiagnoseLeadReport({
  to,
  channelUrl,
  reportToken,
}: {
  to: string;
  channelUrl: string;
  reportToken: string;
}) {
  const reportUrl = `https://www.tubewatch.kr/report/${reportToken}`;
  const signupUrl = "https://www.tubewatch.kr/channels";
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "[TubeWatch] 채널 진단 리포트가 도착했습니다",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
        <h2 style="font-size:18px;font-weight:700;margin-bottom:8px;">채널 진단 리포트가 준비됐습니다.</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;">
          신청하신 채널(<a href="${channelUrl}" style="color:#e85c00;">${channelUrl}</a>)의 분석 리포트를 확인해보세요.
        </p>
        <p style="margin-top:20px;">
          <a href="${reportUrl}" style="background:#000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:14px;">
            리포트 확인하기 →
          </a>
        </p>
        <div style="margin-top:28px;padding:16px;background:#f7f7f7;border-radius:8px;">
          <p style="font-size:14px;font-weight:700;margin:0 0 6px;">직접 운영하고 싶으신가요?</p>
          <p style="color:#555;font-size:13px;line-height:1.6;margin:0 0 14px;">
            TubeWatch에 가입하면 내 채널을 언제든지 직접 분석할 수 있습니다.<br>
            최근 50개 영상 · 30개 시그널 · 9개 지표 · 7개 패턴 분석을 직접 실행해보세요.
          </p>
          <a href="${signupUrl}" style="background:#e85c00;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:13px;">
            무료로 시작하기
          </a>
        </div>
        <p style="color:#555;font-size:13px;line-height:1.6;margin-top:20px;">
          리포트 분석 데이터에 대해 더 깊은 인사이트를 나누고 싶다면, 'Tube Talk' 텔레그램방에서 튜브워치 팀의 피드백을 받아보세요.
        </p>
        <p style="color:#aaa;font-size:11px;margin-top:24px;">TubeWatch™ — YouTube 채널 정밀 분석 서비스</p>
      </div>
    `,
  });
}
