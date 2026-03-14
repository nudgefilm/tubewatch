import { PDFDocument, rgb, type RGB } from "pdf-lib";
import type { PDFFont, PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";
import type { GuestFullReportData } from "@/lib/server/guest/guestReportTypes";

const FONT_PATH = path.join(
  process.cwd(),
  "public",
  "fonts",
  "NotoSansKR-Regular.ttf"
);
const FONT_PATH_DISPLAY = "public/fonts/NotoSansKR-Regular.ttf";

// ——— Typography ———
const TITLE_SIZE = 22;
const COVER_CHANNEL_SIZE = 14;
const SECTION_TITLE_SIZE = 12;
const BODY_TEXT_SIZE = 10;
const SMALL_TEXT_SIZE = 9;
const TITLE_LINE_HEIGHT = 18;
const BODY_LINE_HEIGHT = 14;
const LIST_LINE_HEIGHT = 16;
const SECTION_SPACING = 26;
const DIVIDER_GAP = 8;

// ——— Brand colors (indigo/purple, print-safe) ———
const PRIMARY_COLOR: RGB = rgb(0.31, 0.27, 0.55);
const PRIMARY_SOFT_BG: RGB = rgb(0.96, 0.95, 0.99);
const BORDER_COLOR: RGB = rgb(0.82, 0.79, 0.9);
const LABEL_COLOR: RGB = rgb(0.45, 0.45, 0.52);
const VALUE_COLOR: RGB = rgb(0.12, 0.12, 0.18);
const BODY_COLOR: RGB = rgb(0.12, 0.12, 0.18);
const SUBTEXT_COLOR: RGB = rgb(0.45, 0.45, 0.52);
const DIVIDER_COLOR: RGB = rgb(0.75, 0.72, 0.88);
const BOX_BG: RGB = rgb(0.97, 0.96, 0.99);
const BOX_BORDER: RGB = rgb(0.85, 0.82, 0.92);

const MARGIN = 50;
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const BOX_PADDING = 14;
const CARD_PADDING = 12;
const CARD_GAP = 14;
const ACCENT_BAR_HEIGHT = 5;
const MIN_Y_BEFORE_NEW_PAGE = MARGIN + BODY_LINE_HEIGHT * 2.5;

function wrapLines(
  text: string,
  maxWidth: number,
  font: PDFFont,
  size: number
): string[] {
  const lines: string[] = [];
  const words = text.split(/\s+/);
  let current = "";
  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function loadNotoSansKR(): Uint8Array {
  if (!fs.existsSync(FONT_PATH)) {
    throw new Error(
      `NotoSansKR-Regular.ttf not found at ${FONT_PATH_DISPLAY}`
    );
  }
  const buffer = fs.readFileSync(FONT_PATH);
  return new Uint8Array(buffer);
}

function drawDivider(
  page: PDFPage,
  y: number,
  color: RGB = DIVIDER_COLOR
): number {
  const lineY = y - DIVIDER_GAP / 2;
  page.drawLine({
    start: { x: MARGIN, y: lineY },
    end: { x: MARGIN + CONTENT_WIDTH, y: lineY },
    thickness: 0.8,
    color,
  });
  return lineY - DIVIDER_GAP;
}

function ensureSpace(
  doc: PDFDocument,
  page: PDFPage,
  y: number,
  needed: number
): { page: PDFPage; y: number } {
  let currentPage = page;
  let currentY = y;
  if (currentY - needed < MIN_Y_BEFORE_NEW_PAGE) {
    currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    currentY = PAGE_HEIGHT - MARGIN;
  }
  return { page: currentPage, y: currentY };
}

/** v2: Full cover page with accent bar, title, channel, date, subcopy, prepared for. */
function drawCoverPage(
  doc: PDFDocument,
  page: PDFPage,
  font: PDFFont,
  reportData: GuestFullReportData
): void {
  const channelName =
    typeof reportData.channel_title === "string" && reportData.channel_title
      ? reportData.channel_title
      : "Channel";

  let y = PAGE_HEIGHT - MARGIN;

  // Top accent bar
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - ACCENT_BAR_HEIGHT,
    width: PAGE_WIDTH,
    height: ACCENT_BAR_HEIGHT,
    color: PRIMARY_COLOR,
  });
  y -= ACCENT_BAR_HEIGHT + 36;

  page.drawText("TubeWatch Strategy Report", {
    x: MARGIN,
    y,
    size: TITLE_SIZE,
    font,
    color: PRIMARY_COLOR,
  });
  y -= TITLE_LINE_HEIGHT * 1.3;

  const channelLines = wrapLines(
    channelName,
    CONTENT_WIDTH,
    font,
    COVER_CHANNEL_SIZE
  );
  for (const line of channelLines) {
    page.drawText(line, {
      x: MARGIN,
      y,
      size: COVER_CHANNEL_SIZE,
      font,
      color: VALUE_COLOR,
    });
    y -= COVER_CHANNEL_SIZE + 6;
  }
  y -= 10;

  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  page.drawText(generatedDate, {
    x: MARGIN,
    y,
    size: SMALL_TEXT_SIZE,
    font,
    color: LABEL_COLOR,
  });
  y -= BODY_LINE_HEIGHT * 1.4;

  const subcopy =
    "Actionable insights from recent channel data and content patterns.";
  const subcopyLines = wrapLines(subcopy, CONTENT_WIDTH, font, SMALL_TEXT_SIZE);
  for (const line of subcopyLines) {
    page.drawText(line, {
      x: MARGIN,
      y,
      size: SMALL_TEXT_SIZE,
      font,
      color: SUBTEXT_COLOR,
    });
    y -= SMALL_TEXT_SIZE + 4;
  }

  const preparedY = MARGIN + 28;
  const dividerY = preparedY + BODY_LINE_HEIGHT + 6;
  page.drawLine({
    start: { x: MARGIN, y: dividerY },
    end: { x: MARGIN + CONTENT_WIDTH, y: dividerY },
    thickness: 0.5,
    color: DIVIDER_COLOR,
  });
  const preparedText = `Prepared for ${channelName}`;
  const preparedLines = wrapLines(
    preparedText,
    CONTENT_WIDTH,
    font,
    SMALL_TEXT_SIZE
  );
  let preparedLineY = preparedY;
  for (const line of preparedLines) {
    page.drawText(line, {
      x: MARGIN,
      y: preparedLineY,
      size: SMALL_TEXT_SIZE,
      font,
      color: LABEL_COLOR,
    });
    preparedLineY += BODY_LINE_HEIGHT;
  }
}

/** v2: Snapshot cards (Channel, Key Strengths, Action Items, Benchmark Signals). v3: spacing and value layout polish. */
function drawSnapshotCards(
  doc: PDFDocument,
  page: PDFPage,
  font: PDFFont,
  y: number,
  reportData: GuestFullReportData
): { page: PDFPage; y: number } {
  const cardW = (CONTENT_WIDTH - CARD_GAP) / 2;
  const cardH = 46;
  const totalHeight = cardH * 2 + CARD_GAP + 24;

  let currentPage = page;
  let currY = y - 18;

  const res = ensureSpace(doc, currentPage, currY, totalHeight);
  currentPage = res.page;
  currY = res.y;

  const channelName =
    typeof reportData.channel_title === "string" && reportData.channel_title
      ? reportData.channel_title
      : "—";
  const channelDisplay =
    channelName.length > 24 ? channelName.slice(0, 21) + "…" : channelName;
  const cards: { label: string; value: string }[] = [
    { label: "Channel", value: channelDisplay },
    {
      label: "Key Strengths",
      value: String(reportData.strengths?.length ?? 0),
    },
    {
      label: "Action Items",
      value: String(reportData.growth_action_plan?.length ?? 0),
    },
    {
      label: "Benchmark Signals",
      value: String(reportData.benchmark_items?.length ?? 0),
    },
  ];

  const labelToValueGap = 6;
  const row1Y = currY;
  const row2Y = currY - cardH - CARD_GAP;

  [cards[0], cards[1]].forEach((card, i) => {
    const x = MARGIN + i * (cardW + CARD_GAP);
    currentPage.drawRectangle({
      x,
      y: row1Y - cardH,
      width: cardW,
      height: cardH,
      color: PRIMARY_SOFT_BG,
      borderColor: BORDER_COLOR,
      borderWidth: 0.5,
    });
    currentPage.drawText(card.label, {
      x: x + CARD_PADDING,
      y: row1Y - CARD_PADDING - SMALL_TEXT_SIZE,
      size: SMALL_TEXT_SIZE,
      font,
      color: LABEL_COLOR,
    });
    currentPage.drawText(card.value, {
      x: x + CARD_PADDING,
      y: row1Y - cardH + CARD_PADDING + labelToValueGap,
      size: SECTION_TITLE_SIZE,
      font,
      color: VALUE_COLOR,
    });
  });
  [cards[2], cards[3]].forEach((card, i) => {
    const x = MARGIN + i * (cardW + CARD_GAP);
    currentPage.drawRectangle({
      x,
      y: row2Y - cardH,
      width: cardW,
      height: cardH,
      color: PRIMARY_SOFT_BG,
      borderColor: BORDER_COLOR,
      borderWidth: 0.5,
    });
    currentPage.drawText(card.label, {
      x: x + CARD_PADDING,
      y: row2Y - CARD_PADDING - SMALL_TEXT_SIZE,
      size: SMALL_TEXT_SIZE,
      font,
      color: LABEL_COLOR,
    });
    currentPage.drawText(card.value, {
      x: x + CARD_PADDING,
      y: row2Y - cardH + CARD_PADDING + labelToValueGap,
      size: SECTION_TITLE_SIZE,
      font,
      color: VALUE_COLOR,
    });
  });

  return { page: currentPage, y: row2Y - cardH - 22 };
}

/** v2: Executive Summary box from reportData only. v3: density and line length polish (max 3 lines, shorter slices). */
function drawExecutiveSummaryBox(
  doc: PDFDocument,
  page: PDFPage,
  font: PDFFont,
  y: number,
  reportData: GuestFullReportData
): { page: PDFPage; y: number } {
  const summaryLines: string[] = [];
  const cs = (reportData.channel_summary ?? "").trim();
  if (cs) {
    summaryLines.push(cs.slice(0, 72) + (cs.length > 72 ? "…" : ""));
  }
  const firstAction =
    Array.isArray(reportData.growth_action_plan) &&
    reportData.growth_action_plan.length > 0
      ? reportData.growth_action_plan[0]
      : null;
  if (firstAction && summaryLines.length < 3) {
    summaryLines.push(firstAction.slice(0, 58) + (firstAction.length > 58 ? "…" : ""));
  }
  const cps = (reportData.content_pattern_summary ?? "").trim();
  if (cps && summaryLines.length < 2) {
    summaryLines.push(cps.slice(0, 62) + (cps.length > 62 ? "…" : ""));
  }
  if (summaryLines.length === 0) {
    summaryLines.push("Key insights are detailed in the sections below.");
  }

  const title = "Executive Summary";
  const maxWidth = CONTENT_WIDTH - 2 * BOX_PADDING;
  const summaryLineCount = summaryLines.reduce(
    (acc, t) => acc + wrapLines(t, maxWidth, font, BODY_TEXT_SIZE).length,
    0
  );
  const lineGap = 2;
  const boxHeight =
    2 * BOX_PADDING +
    SECTION_TITLE_SIZE +
    6 +
    summaryLineCount * BODY_LINE_HEIGHT +
    Math.max(0, summaryLines.length - 1) * lineGap +
    8;

  let currentPage = page;
  let currY = y - 14;

  if (currY - boxHeight < MIN_Y_BEFORE_NEW_PAGE) {
    currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    currY = PAGE_HEIGHT - MARGIN;
  }

  const boxY = currY - boxHeight;
  currentPage.drawRectangle({
    x: MARGIN,
    y: boxY,
    width: CONTENT_WIDTH,
    height: boxHeight,
    color: BOX_BG,
    borderColor: BOX_BORDER,
    borderWidth: 0.5,
  });

  let textY = currY - BOX_PADDING - SECTION_TITLE_SIZE;
  currentPage.drawText(title, {
    x: MARGIN + BOX_PADDING,
    y: textY,
    size: SECTION_TITLE_SIZE,
    font,
    color: PRIMARY_COLOR,
  });
  textY -= SECTION_TITLE_SIZE + 6;

  for (const line of summaryLines) {
    const wrapped = wrapLines(line, maxWidth, font, BODY_TEXT_SIZE);
    for (const w of wrapped) {
      currentPage.drawText(w, {
        x: MARGIN + BOX_PADDING,
        y: textY,
        size: BODY_TEXT_SIZE,
        font,
        color: BODY_COLOR,
      });
      textY -= BODY_LINE_HEIGHT;
    }
    textY -= lineGap;
  }

  return { page: currentPage, y: boxY - DIVIDER_GAP - 4 };
}

function drawSection(
  doc: PDFDocument,
  page: PDFPage,
  font: PDFFont,
  y: number,
  title: string,
  content: string,
  opts: { noDivider?: boolean; introLine?: string } = {}
): { page: PDFPage; y: number } {
  let currentPage = page;
  let currY = y - SECTION_SPACING;

  const needed =
    SECTION_TITLE_SIZE +
    (opts.introLine ? BODY_LINE_HEIGHT + 6 : 0) +
    BODY_LINE_HEIGHT * 6 +
    12;
  const { page: p1, y: y1 } = ensureSpace(doc, currentPage, currY, needed);
  currentPage = p1;
  currY = y1;

  currentPage.drawText(title, {
    x: MARGIN,
    y: currY,
    size: SECTION_TITLE_SIZE,
    font,
    color: PRIMARY_COLOR,
  });
  currY -= SECTION_TITLE_SIZE + 4;
  currY = drawDivider(currentPage, currY) - BODY_LINE_HEIGHT;

  if (opts.introLine) {
    const introLines = wrapLines(
      opts.introLine,
      CONTENT_WIDTH,
      font,
      SMALL_TEXT_SIZE
    );
    for (const line of introLines) {
      currentPage.drawText(line, {
        x: MARGIN,
        y: currY,
        size: SMALL_TEXT_SIZE,
        font,
        color: LABEL_COLOR,
      });
      currY -= BODY_LINE_HEIGHT;
    }
    currY -= 6;
  }

  const lines = wrapLines(content, CONTENT_WIDTH, font, BODY_TEXT_SIZE);
  for (const line of lines) {
    if (currY < MIN_Y_BEFORE_NEW_PAGE) {
      currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      currY = PAGE_HEIGHT - MARGIN;
    }
    currentPage.drawText(line, {
      x: MARGIN,
      y: currY,
      size: BODY_TEXT_SIZE,
      font,
      color: BODY_COLOR,
    });
    currY -= BODY_LINE_HEIGHT;
  }

  if (!opts.noDivider) {
    currY = drawDivider(currentPage, currY);
  }
  return { page: currentPage, y: currY };
}

function drawList(
  doc: PDFDocument,
  page: PDFPage,
  font: PDFFont,
  y: number,
  title: string,
  items: string[],
  numbered: boolean = true
): { page: PDFPage; y: number } {
  let currentPage = page;
  let currY = y - SECTION_SPACING;

  const { page: p1, y: y1 } = ensureSpace(
    doc,
    currentPage,
    currY,
    SECTION_TITLE_SIZE + LIST_LINE_HEIGHT * 4 + 14
  );
  currentPage = p1;
  currY = y1;

  currentPage.drawText(title, {
    x: MARGIN,
    y: currY,
    size: SECTION_TITLE_SIZE,
    font,
    color: PRIMARY_COLOR,
  });
  currY -= SECTION_TITLE_SIZE + 4;
  currY = drawDivider(currentPage, currY) - LIST_LINE_HEIGHT;

  for (let i = 0; i < items.length; i++) {
    if (currY < MIN_Y_BEFORE_NEW_PAGE) {
      currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      currY = PAGE_HEIGHT - MARGIN;
    }
    const prefix = numbered ? `${i + 1}. ` : "• ";
    const lines = wrapLines(
      `${prefix}${items[i]}`,
      CONTENT_WIDTH,
      font,
      BODY_TEXT_SIZE
    );
    for (const line of lines) {
      if (currY < MIN_Y_BEFORE_NEW_PAGE) {
        currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        currY = PAGE_HEIGHT - MARGIN;
      }
      currentPage.drawText(line, {
        x: MARGIN,
        y: currY,
        size: BODY_TEXT_SIZE,
        font,
        color: BODY_COLOR,
      });
      currY -= BODY_LINE_HEIGHT;
    }
    currY -= 4;
  }

  currY = drawDivider(currentPage, currY);
  return { page: currentPage, y: currY };
}

function drawHighlightBox(
  doc: PDFDocument,
  page: PDFPage,
  font: PDFFont,
  y: number,
  text: string
): { page: PDFPage; y: number } {
  const boxWidth = CONTENT_WIDTH;
  const maxWidth = boxWidth - 2 * BOX_PADDING;
  const lines = wrapLines(text, maxWidth, font, BODY_TEXT_SIZE);
  const boxHeight = lines.length * BODY_LINE_HEIGHT + 2 * BOX_PADDING;

  let currentPage = page;
  let currY = y - 12;

  if (currY - boxHeight < MIN_Y_BEFORE_NEW_PAGE) {
    currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    currY = PAGE_HEIGHT - MARGIN;
  }

  const boxY = currY - boxHeight;
  currentPage.drawRectangle({
    x: MARGIN,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    color: BOX_BG,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5,
  });

  let textY = currY - BOX_PADDING - BODY_LINE_HEIGHT;
  for (const line of lines) {
    currentPage.drawText(line, {
      x: MARGIN + BOX_PADDING,
      y: textY,
      size: BODY_TEXT_SIZE,
      font,
      color: BODY_COLOR,
    });
    textY -= BODY_LINE_HEIGHT;
  }

  return { page: currentPage, y: boxY - DIVIDER_GAP };
}

/**
 * Generates a PDF buffer from full guest report data.
 * v3: Cover/snapshot/summary/CTA polish, spacing, copy tone, output stability.
 */
export async function generateStrategyPdf(
  reportData: GuestFullReportData
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const fontBytes = loadNotoSansKR();
  const font = await doc.embedFont(fontBytes);

  const coverPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawCoverPage(doc, coverPage, font, reportData);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  // ——— Snapshot cards ———
  let result = drawSnapshotCards(doc, page, font, y, reportData);
  page = result.page;
  y = result.y;

  // ——— Executive Summary ———
  result = drawExecutiveSummaryBox(doc, page, font, y, reportData);
  page = result.page;
  y = result.y;

  // ——— Channel Overview ———
  const sub = reportData.subscriber_count ?? 0;
  const vid = reportData.video_count ?? 0;
  const overviewContent = `${reportData.channel_title}. Subscribers: ${sub.toLocaleString("ko-KR")}, Videos: ${vid.toLocaleString("ko-KR")}. ${reportData.channel_summary}`;
  result = drawSection(
    doc,
    page,
    font,
    y,
    "Channel Overview",
    overviewContent,
    {
      introLine:
        "Summary of the channel's content direction and audience response.",
    }
  );
  page = result.page;
  y = result.y;

  const summaryLine =
    reportData.channel_summary.trim().slice(0, 120) +
    (reportData.channel_summary.length > 120 ? "…" : "");
  result = drawHighlightBox(doc, page, font, y, summaryLine || "—");
  page = result.page;
  y = result.y;

  // ——— Growth Radar ———
  result = ensureSpace(doc, page, y, SECTION_TITLE_SIZE + BODY_LINE_HEIGHT * 8 + 14);
  page = result.page;
  y = result.y;
  result = drawSection(
    doc,
    page,
    font,
    y,
    "Growth Radar",
    `View competitiveness: ${reportData.metrics.avgViewCount.toFixed(0)}, Like ratio: ${(reportData.metrics.avgLikeRatio * 100).toFixed(2)}%, Comment ratio: ${(reportData.metrics.avgCommentRatio * 100).toFixed(2)}%, Upload interval (days): ${reportData.metrics.avgUploadIntervalDays.toFixed(1)}, Recent 30d uploads: ${reportData.metrics.recent30dUploadCount}, Avg tags: ${reportData.metrics.avgTagCount.toFixed(1)}.`
  );
  page = result.page;
  y = result.y;

  // ——— Strengths ———
  result = drawList(doc, page, font, y, "Strengths", reportData.strengths);
  page = result.page;
  y = result.y;

  // ——— Weaknesses ———
  result = drawList(doc, page, font, y, "Weaknesses", reportData.weaknesses);
  page = result.page;
  y = result.y;

  // ——— Content Pattern ———
  result = drawSection(
    doc,
    page,
    font,
    y,
    "Content Pattern",
    reportData.content_pattern_summary
  );
  page = result.page;
  y = result.y;
  if (reportData.content_patterns.length > 0) {
    result = drawList(
      doc,
      page,
      font,
      y,
      "Patterns",
      reportData.content_patterns,
      false
    );
    page = result.page;
    y = result.y;
  }

  // ——— SEO Optimization ———
  const seoText = reportData.seo_items
    .map((s) => `${s.title}: ${s.recommendation}`)
    .join(" | ");
  result = drawSection(
    doc,
    page,
    font,
    y,
    "SEO Optimization",
    seoText || "—",
    {
      introLine:
        "Recommendations for discoverability and keyword alignment.",
    }
  );
  page = result.page;
  y = result.y;

  // ——— Growth Action Plan ———
  const actionSummary =
    "Recommended actions to support channel growth.";
  result = drawHighlightBox(doc, page, font, y, actionSummary);
  page = result.page;
  y = result.y;
  result = drawList(
    doc,
    page,
    font,
    y,
    "Growth Action Plan",
    reportData.growth_action_plan,
    true
  );
  page = result.page;
  y = result.y;

  if (reportData.action_plan_items.length > 0) {
    const actionText = reportData.action_plan_items
      .map((a) => `${a.title}: ${a.reason}`)
      .join(" | ");
    result = drawSection(doc, page, font, y, "Action Items", actionText);
    page = result.page;
    y = result.y;
  }

  // ——— Benchmark Position ———
  const benchText = reportData.benchmark_items
    .map(
      (b) =>
        `${b.title}: ${b.current_score}/${b.benchmark_score} (${b.status_label})`
    )
    .join(" | ");
  result = drawSection(
    doc,
    page,
    font,
    y,
    "Benchmark Position",
    benchText || "—"
  );
  page = result.page;
  y = result.y;

  // ——— CTA: Next Step (closing section) ———
  const ctaBlockHeight = TITLE_LINE_HEIGHT * 6 + 56;
  result = ensureSpace(doc, page, y, ctaBlockHeight);
  page = result.page;
  y = result.y;
  y = drawDivider(page, y, PRIMARY_COLOR) - BODY_LINE_HEIGHT * 2.2;

  page.drawText("Next Step", {
    x: MARGIN,
    y,
    size: SECTION_TITLE_SIZE,
    font,
    color: PRIMARY_COLOR,
  });
  y -= SECTION_TITLE_SIZE + 10;

  const ctaText =
    "For ongoing monitoring and strategy updates, you can continue with TubeWatch.";
  const ctaLines = wrapLines(ctaText, CONTENT_WIDTH, font, BODY_TEXT_SIZE);
  for (const line of ctaLines) {
    if (y < MIN_Y_BEFORE_NEW_PAGE) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
    page.drawText(line, {
      x: MARGIN,
      y,
      size: BODY_TEXT_SIZE,
      font,
      color: BODY_COLOR,
    });
    y -= BODY_LINE_HEIGHT;
  }

  const appUrl =
    typeof process.env.NEXT_PUBLIC_APP_URL === "string" &&
    process.env.NEXT_PUBLIC_APP_URL.trim() !== ""
      ? process.env.NEXT_PUBLIC_APP_URL.trim()
      : "https://tubewatch.app";
  const billingUrl = `${appUrl.replace(/\/$/, "")}/billing`;
  y -= BODY_LINE_HEIGHT;
  page.drawText(`Details: ${billingUrl}`, {
    x: MARGIN,
    y,
    size: SMALL_TEXT_SIZE,
    font,
    color: LABEL_COLOR,
  });

  return doc.save();
}
