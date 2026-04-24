import Anthropic from "@anthropic-ai/sdk";
import { MANUS_PROJECT_INSTRUCTION } from "@/lib/manus/prompt";
import type { ManusReportJson } from "@/lib/manus/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateReport(payload: string): Promise<ManusReportJson> {
  const response = await anthropic.messages.create({
    model: process.env.REPORT_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 16000,
    temperature: 0,
    system: MANUS_PROJECT_INSTRUCTION,
    messages: [{ role: "user", content: payload }],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Claude 응답 타입 오류");

  const text = block.text;
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start === -1 || end < start) throw new Error("Claude 응답에서 JSON을 찾을 수 없음");

  const resultJson = JSON.parse(text.slice(start, end + 1)) as ManusReportJson;
  if (!resultJson.section1_scorecard) {
    throw new Error("리포트 스키마 불일치: section1_scorecard 누락");
  }

  return resultJson;
}
