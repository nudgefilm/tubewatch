import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import Anthropic from '@anthropic-ai/sdk';

const CLIENT_ID = process.env.NAVER_CLIENT_ID!;
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET!;

export type TrendPoint = { period: string; ratio: number };
export type TrendResult = {
  keyword: string;
  data: TrendPoint[];
  currentRatio: number;
  prevRatio: number;
  trend: 'up' | 'down' | 'flat';
  changePct: number;
};
export type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
};
export type NaverTrendsResponse = {
  trends: TrendResult[];
  news: NewsItem[];
  topKeyword: string;
  tags: string[];
  insight: string | null;
  fetchedAt: string;
};

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function decodeHtml(str: string): string {
  return str
    .replace(/&quot;/g, '"').replace(/&#34;/g, '"')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ');
}

const STOP = new Set([
  '및', '의', '가', '이', '은', '는', '을', '를', '에', '에서', '로', '으로', '와', '과', '도', '만',
  '한', '등', '대한', '위한', '된', '수', '것', '그', '또', '후', '전', '중', '각', '더', '부터', '까지',
  '위해', '통해', '대해', '관련', '따른', '속', '이후', '이전', '이번', '지난', '올해', '현재', '최근',
  '나타나', '정부', '분석', '전망', '예측', '발표', '추진', '계획', '방안', '기준',
]);

function extractTags(titles: string[]): string[] {
  const cnt: Record<string, number> = {};
  for (const title of titles) {
    const words = title
      .split(/[\s,.\[\]()?!…·:"'"「」『』\-/\\|<>②③④⑤]+/)
      .filter(w => w.length >= 2 && !STOP.has(w) && !/^\d+[년월일]?$/.test(w) && !/^[a-zA-Z]{1,2}$/.test(w));
    for (const w of words) cnt[w] = (cnt[w] ?? 0) + 1;
  }
  return Object.entries(cnt).sort(([, a], [, b]) => b - a).slice(0, 3).map(([w]) => w);
}

async function generateInsight(topKeyword: string, tags: string[], channelCtx: string): Promise<string | null> {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      messages: [{
        role: 'user',
        content: `채널 특성: ${channelCtx}
뉴스 핫 이슈: ${topKeyword} / 연관 키워드: ${tags.slice(0, 2).join(', ')}

위 채널이 이 뉴스 이슈를 콘텐츠로 만들면 어떨지 크리에이터에게 자연스럽게 한 줄로 조언해주세요.
- 40자 이내
- 예상 효과를 구체적인 수치(조회수 배수 또는 % 상승)로 표현
- 전문 용어 없이 누구나 이해할 수 있는 친근한 문장
- "~다루면 조회수 X배 기대", "~주제로 영상 만들면 반응 클 것" 같은 실용적 형식`,
      }],
    });
    return (msg.content[0] as { type: 'text'; text: string }).text.trim();
  } catch {
    return null;
  }
}

async function fetchNaverTrends(keywords: string[], channelCtx?: string): Promise<NaverTrendsResponse> {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 28);

  const naverHeaders = {
    'X-Naver-Client-Id': CLIENT_ID,
    'X-Naver-Client-Secret': CLIENT_SECRET,
    'Content-Type': 'application/json',
  };

  const datalabRes = await fetch('https://openapi.naver.com/v1/datalab/search', {
    method: 'POST',
    headers: naverHeaders,
    body: JSON.stringify({
      startDate: fmtDate(start),
      endDate: fmtDate(today),
      timeUnit: 'week',
      keywordGroups: keywords.map(kw => ({ groupName: kw, keywords: [kw] })),
    }),
  });

  const trends: TrendResult[] = [];
  if (datalabRes.ok) {
    const json = await datalabRes.json() as { results?: Array<{ title: string; data: TrendPoint[] }> };
    for (const r of json.results ?? []) {
      const data: TrendPoint[] = r.data ?? [];
      const last = data[data.length - 1]?.ratio ?? 0;
      const prev = data.slice(0, -1);
      const prevAvg = prev.length ? prev.reduce((s, p) => s + p.ratio, 0) / prev.length : last;
      const changePct = prevAvg > 0 ? Math.round(((last - prevAvg) / prevAvg) * 100) : 0;
      trends.push({
        keyword: r.title, data: data.slice(-4),
        currentRatio: Math.round(last), prevRatio: Math.round(prevAvg),
        trend: changePct >= 8 ? 'up' : changePct <= -8 ? 'down' : 'flat', changePct,
      });
    }
  } else {
    console.error(`[naver/datalab] ${datalabRes.status}:`, await datalabRes.text());
  }

  const topKeyword = [...trends].sort((a, b) => b.currentRatio - a.currentRatio)[0]?.keyword ?? keywords[0];

  const newsRes = await fetch(
    `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(topKeyword)}&display=5&sort=date`,
    { headers: { 'X-Naver-Client-Id': CLIENT_ID, 'X-Naver-Client-Secret': CLIENT_SECRET } }
  );

  const news: NewsItem[] = [];
  if (newsRes.ok) {
    const json = await newsRes.json() as {
      items?: Array<{ title: string; originallink: string; link: string; description: string; pubDate: string }>;
    };
    for (const item of json.items ?? []) {
      news.push({
        title: decodeHtml(item.title.replace(/<[^>]+>/g, '')),
        link: item.originallink || item.link,
        pubDate: item.pubDate,
        description: decodeHtml(item.description.replace(/<[^>]+>/g, '')).slice(0, 80),
      });
    }
  } else {
    console.error(`[naver/news] ${newsRes.status}:`, await newsRes.text());
  }

  if (trends.length === 0 && news.length === 0) {
    throw new Error(`Naver API error: datalab=${datalabRes.status}, news=${newsRes.status}`);
  }

  const tags = extractTags(news.map(n => n.title));
  const insight = (channelCtx && tags.length > 0)
    ? await generateInsight(topKeyword, tags, channelCtx)
    : null;

  return { trends, news, topKeyword, tags, insight, fetchedAt: new Date().toISOString() };
}

export async function GET(req: NextRequest) {
  const kw = req.nextUrl.searchParams.get('keywords');
  if (!kw) return NextResponse.json({ error: 'no keywords' }, { status: 400 });

  const keywords = kw.split(',').map(k => k.trim()).filter(Boolean).slice(0, 3);
  if (!keywords.length) return NextResponse.json({ error: 'no keywords' }, { status: 400 });

  const channelCtx = req.nextUrl.searchParams.get('channelCtx') ?? undefined;
  const cacheKey = `v3:${keywords.slice().sort().join(',')}:${channelCtx?.slice(0, 60) ?? ''}`;

  const getCached = unstable_cache(
    () => fetchNaverTrends(keywords, channelCtx),
    ['naver-trends', cacheKey],
    { revalidate: 21600 }
  );

  try {
    const data = await getCached();
    return NextResponse.json(data);
  } catch (e) {
    console.error('[naver/route] fetch failed:', e);
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 });
  }
}
