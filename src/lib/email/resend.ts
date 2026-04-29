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
      <p><a href="https://tubewatch.kr/admin/enterprise-orders">어드민에서 확인하기</a></p>
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
      <p><a href="https://tubewatch.kr/admin/enterprise-orders">어드민에서 결제 안내 발송하기</a></p>
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
  const paymentUrl = `https://tubewatch.kr/billing?enterprise=1&inquiry_id=${inquiryId}`;

  // 초기 수동 운영으로 인해 고객 자동 메일 비활성화
  // 결제 링크는 관리자가 직접 별도 채널(이메일·메신저)로 전달
  // await resend.emails.send({
  //   from: FROM_EMAIL,
  //   to,
  //   subject: "채널 컨설팅 서비스 결제 안내 — Channel Report",
  //   html: `
  //     <h2>${agencyName} 담당자님께</h2>
  //     <p>채널 컨설팅 서비스(Enterprise Standard) 신청을 접수했습니다.</p>
  //     <p>아래 링크에서 카드 결제를 진행해주세요.</p>
  //     <p><a href="${paymentUrl}" style="background:#000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">결제하기 (₩330,000)</a></p>
  //     <p style="color:#888;font-size:12px;">현금 결제를 원하시는 경우 담당자에게 별도 문의 바랍니다.</p>
  //     <p style="color:#888;font-size:12px;">분석 대상 채널: ${channelUrl}</p>
  //   `,
  // });

  // 관리자용 참고: 아래 URL을 직접 복사해 발송
  void paymentUrl;
}
