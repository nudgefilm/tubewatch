import Anthropic from "@anthropic-ai/sdk";
import { REPORT_SYSTEM_PROMPT } from "@/lib/report/prompt";
import type { ReportJson } from "@/lib/report/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export function parseReportJson(text: string): ReportJson {
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start === -1 || end < start) throw new Error("Claude 응답에서 JSON을 찾을 수 없음");
  const resultJson = JSON.parse(text.slice(start, end + 1)) as ReportJson;
  if (!resultJson.section1_scorecard) {
    throw new Error("리포트 스키마 불일치: section1_scorecard 누락");
  }
  return resultJson;
}

// process route fallback용 동기 호출
export async function generateReport(payload: string): Promise<ReportJson> {
  const response = await anthropic.messages.create({
    model: process.env.REPORT_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 14000,
    temperature: 0,
    system: REPORT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: payload }],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Claude 응답 타입 오류");
  return parseReportJson(block.text);
}

// 스트리밍용 — SSE route에서 사용
export async function* streamReport(payload: string): AsyncGenerator<string> {
  const response = await anthropic.messages.create({
    model: process.env.REPORT_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 14000,
    temperature: 0,
    system: REPORT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: payload }],
    stream: true,
  });

  for await (const event of response) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
