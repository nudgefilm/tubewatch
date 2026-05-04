import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

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
  fetchedAt: string;
};

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function decodeHtml(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

async function fetchNaverTrends(keywords: string[]): Promise<NaverTrendsResponse> {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 28);

  const naverHeaders = {
    'X-Naver-Client-Id': CLIENT_ID,
    'X-Naver-Client-Secret': CLIENT_SECRET,
    'Content-Type': 'application/json',
  };

  // DataLab 검색어 트렌드
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
      const prevAvg = prev.length
        ? prev.reduce((s, p) => s + p.ratio, 0) / prev.length
        : last;
      const changePct = prevAvg > 0 ? Math.round(((last - prevAvg) / prevAvg) * 100) : 0;
      trends.push({
        keyword: r.title,
        data: data.slice(-4),
        currentRatio: Math.round(last),
        prevRatio: Math.round(prevAvg),
        trend: changePct >= 8 ? 'up' : changePct <= -8 ? 'down' : 'flat',
        changePct,
      });
    }
  } else {
    const errText = await datalabRes.text();
    console.error(`[naver/datalab] ${datalabRes.status}:`, errText);
  }

  // 가장 검색량 높은 키워드로 뉴스 조회
  const topKeyword =
    [...trends].sort((a, b) => b.currentRatio - a.currentRatio)[0]?.keyword ?? keywords[0];

  const newsRes = await fetch(
    `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(topKeyword)}&display=4&sort=date`,
    {
      headers: {
        'X-Naver-Client-Id': CLIENT_ID,
        'X-Naver-Client-Secret': CLIENT_SECRET,
      },
    }
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
    const errText = await newsRes.text();
    console.error(`[naver/news] ${newsRes.status}:`, errText);
  }

  // 둘 다 실패하면 throw → unstable_cache가 빈 결과를 캐싱하지 않도록
  if (trends.length === 0 && news.length === 0) {
    throw new Error(`Naver API error: datalab=${datalabRes.status}, news=${newsRes.status}`);
  }

  return { trends, news, topKeyword, fetchedAt: new Date().toISOString() };
}

export async function GET(req: NextRequest) {
  const kw = req.nextUrl.searchParams.get('keywords');
  if (!kw) return NextResponse.json({ error: 'no keywords' }, { status: 400 });

  const keywords = kw.split(',').map(k => k.trim()).filter(Boolean).slice(0, 3);
  if (!keywords.length) return NextResponse.json({ error: 'no keywords' }, { status: 400 });

  // v2: 캐시 키 버전 포함 (빈 결과 캐시 bust)
  const cacheKey = `v2:${keywords.slice().sort().join(',')}`;

  const getCached = unstable_cache(
    () => fetchNaverTrends(keywords),
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
