"use client";

type ChannelDnaRadarMetrics = {
  avgViewCount: number;
  avgLikeRatio: number;
  avgCommentRatio: number;
  avgUploadIntervalDays: number;
  recent30dUploadCount: number;
  avgTagCount: number;
};

type ChannelDnaRadarProps = {
  metrics: ChannelDnaRadarMetrics;
};

type RadarAxis = {
  key: keyof ChannelDnaRadarMetrics;
  label: string;
  baseline: number;
  normalize: (value: number) => number;
};

function interpolate(value: number, breakpoints: [number, number][]): number {
  if (breakpoints.length === 0) return 0;
  if (value <= breakpoints[0][0]) return breakpoints[0][1];

  for (let i = 1; i < breakpoints.length; i++) {
    const [x0, y0] = breakpoints[i - 1];
    const [x1, y1] = breakpoints[i];
    if (value <= x1) {
      const t = (value - x0) / (x1 - x0);
      return Math.max(0, Math.min(100, y0 + t * (y1 - y0)));
    }
  }

  return Math.min(100, breakpoints[breakpoints.length - 1][1]);
}

const RADAR_AXES: RadarAxis[] = [
  {
    key: "avgViewCount",
    label: "조회수 경쟁력",
    baseline: 70,
    normalize: (v) =>
      interpolate(v, [[0, 0], [1000, 40], [5000, 70], [10000, 100]]),
  },
  {
    key: "avgLikeRatio",
    label: "좋아요 반응",
    baseline: 70,
    normalize: (v) =>
      interpolate(v, [[0, 0], [0.03, 60], [0.06, 100]]),
  },
  {
    key: "avgCommentRatio",
    label: "댓글 참여도",
    baseline: 60,
    normalize: (v) =>
      interpolate(v, [[0, 0], [0.005, 60], [0.01, 100]]),
  },
  {
    key: "avgUploadIntervalDays",
    label: "업로드 규칙성",
    baseline: 70,
    normalize: (v) =>
      interpolate(v, [[0, 100], [3, 100], [7, 70], [14, 40], [30, 10]]),
  },
  {
    key: "recent30dUploadCount",
    label: "최근 활동성",
    baseline: 70,
    normalize: (v) =>
      interpolate(v, [[0, 0], [4, 50], [8, 80], [12, 100]]),
  },
  {
    key: "avgTagCount",
    label: "SEO 태그 활용",
    baseline: 60,
    normalize: (v) =>
      interpolate(v, [[0, 0], [5, 60], [10, 100]]),
  },
];

const CX = 170;
const CY = 155;
const RADIUS = 105;
const LABEL_RADIUS = RADIUS + 24;
const GRID_LEVELS = [25, 50, 75, 100];
const AXIS_COUNT = RADAR_AXES.length;
const ANGLE_STEP = (2 * Math.PI) / AXIS_COUNT;
const START_ANGLE = -Math.PI / 2;

function getPoint(axisIndex: number, normalizedValue: number): { x: number; y: number } {
  const angle = START_ANGLE + axisIndex * ANGLE_STEP;
  const r = (normalizedValue / 100) * RADIUS;
  return {
    x: CX + r * Math.cos(angle),
    y: CY + r * Math.sin(angle),
  };
}

function getLabelPosition(axisIndex: number): { x: number; y: number } {
  const angle = START_ANGLE + axisIndex * ANGLE_STEP;
  return {
    x: CX + LABEL_RADIUS * Math.cos(angle),
    y: CY + LABEL_RADIUS * Math.sin(angle),
  };
}

function buildPolygonPoints(values: number[]): string {
  return values
    .map((v, i) => {
      const p = getPoint(i, v);
      return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    })
    .join(" ");
}

type SvgTextAnchor = "middle" | "start" | "end";

function getLabelAnchor(axisIndex: number): { textAnchor: SvgTextAnchor; dy: number } {
  const angle = START_ANGLE + axisIndex * ANGLE_STEP;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  let textAnchor: SvgTextAnchor = "middle";
  if (cos > 0.3) textAnchor = "start";
  else if (cos < -0.3) textAnchor = "end";

  let dy = 4;
  if (sin < -0.3) dy = -4;
  else if (sin > 0.3) dy = 14;

  return { textAnchor, dy };
}

export default function ChannelDnaRadar({ metrics }: ChannelDnaRadarProps): JSX.Element {
  const channelValues = RADAR_AXES.map((axis) =>
    Math.round(axis.normalize(metrics[axis.key]))
  );
  const baselineValues = RADAR_AXES.map((axis) => axis.baseline);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
        Channel DNA
      </h2>
      <p className="mb-4 text-sm text-gray-500">
        채널 성과 점수를 성장 채널 기준과 비교합니다.
      </p>

      <div className="mx-auto max-w-sm sm:max-w-md">
        <svg
          viewBox="0 0 340 310"
          className="w-full"
          role="img"
          aria-label="채널 DNA 레이더 차트"
        >
          {/* Grid rings */}
          {GRID_LEVELS.map((level) => (
            <polygon
              key={`grid-${level}`}
              points={buildPolygonPoints(Array(AXIS_COUNT).fill(level))}
              fill="none"
              stroke={level === 100 ? "#d1d5db" : "#e5e7eb"}
              strokeWidth={level === 100 ? 1.2 : 0.6}
            />
          ))}

          {/* Axis lines */}
          {RADAR_AXES.map((_, i) => {
            const end = getPoint(i, 100);
            return (
              <line
                key={`axis-${i}`}
                x1={CX}
                y1={CY}
                x2={end.x}
                y2={end.y}
                stroke="#e5e7eb"
                strokeWidth={0.6}
              />
            );
          })}

          {/* Channel DNA reference polygon */}
          <polygon
            points={buildPolygonPoints(baselineValues)}
            fill="none"
            stroke="#9ca3af"
            strokeWidth={1.5}
            strokeDasharray="6 3"
          />

          {/* Channel data polygon */}
          <polygon
            points={buildPolygonPoints(channelValues)}
            fill="rgba(99, 102, 241, 0.15)"
            stroke="#6366f1"
            strokeWidth={2}
          />

          {/* Channel data points */}
          {channelValues.map((v, i) => {
            const p = getPoint(i, v);
            return (
              <circle
                key={`point-${i}`}
                cx={p.x}
                cy={p.y}
                r={3.5}
                fill="#6366f1"
                stroke="#ffffff"
                strokeWidth={2}
              />
            );
          })}

          {/* Axis labels */}
          {RADAR_AXES.map((axis, i) => {
            const pos = getLabelPosition(i);
            const { textAnchor, dy } = getLabelAnchor(i);
            return (
              <text
                key={`label-${i}`}
                x={pos.x}
                y={pos.y + dy}
                textAnchor={textAnchor}
                className="fill-gray-600 text-[11px] font-medium"
              >
                {axis.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-6 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-500/80" />
          채널 현재 수준
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-px w-4 border-t-[2px] border-dashed border-gray-400" />
          성장 채널 기준
        </span>
      </div>

      {/* Score detail grid */}
      <div className="mt-4 grid grid-cols-3 gap-6 sm:grid-cols-6">
        {RADAR_AXES.map((axis, i) => {
          const score = channelValues[i];
          const diff = score - axis.baseline;
          const diffColor =
            diff >= 0 ? "text-emerald-600" : "text-red-500";
          const diffSign = diff >= 0 ? "+" : "";
          return (
            <div
              key={axis.key}
              className="rounded-lg bg-gray-50 px-2.5 py-2 text-center"
            >
              <p className="text-[10px] font-medium text-gray-500">
                {axis.label}
              </p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-gray-900">
                {score}
              </p>
              <p className={`text-[10px] font-semibold tabular-nums ${diffColor}`}>
                {diffSign}{diff}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
