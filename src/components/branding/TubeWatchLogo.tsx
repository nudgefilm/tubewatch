type TubeWatchLogoProps = {
  size?: number;
  animated?: boolean;
  showWordmark?: boolean;
  className?: string;
};

const CX = 15;
const CY = 20;

const HOUR_END_X = 10.7;
const HOUR_END_Y = 17.5;
const MINUTE_END_Y = 13;
const SECOND_TAIL = 1.5;
const SECOND_TIP_Y = 11.5;

export default function TubeWatchLogo({
  size = 32,
  animated = true,
  showWordmark = false,
  className = "",
}: TubeWatchLogoProps): JSX.Element {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="TubeWatch"
        role="img"
      >
        <style>
          {[
            "@keyframes tw-sweep{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}",
            "@media(prefers-reduced-motion:reduce){.tw-sec{animation:none!important}}",
          ].join("")}
        </style>

        <path
          d="M12.5 4.5C9 2 5 4.5 5 8.5v23c0 4 4 6.2 7.5 4L35 22c2-1.2 2-2.8 0-4L12.5 4.5z"
          fill="#161616"
        />

        <line
          x1={CX}
          y1={CY}
          x2={HOUR_END_X}
          y2={HOUR_END_Y}
          stroke="#fff"
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        <line
          x1={CX}
          y1={CY}
          x2={CX}
          y2={MINUTE_END_Y}
          stroke="#fff"
          strokeWidth={2}
          strokeLinecap="round"
        />

        <line
          className="tw-sec"
          x1={CX}
          y1={CY + SECOND_TAIL}
          x2={CX}
          y2={SECOND_TIP_Y}
          stroke="#fff"
          strokeWidth={1}
          strokeLinecap="round"
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            ...(animated
              ? { animation: "tw-sweep 60s linear infinite" }
              : {}),
          }}
        />

        <circle cx={CX} cy={CY} r={1.4} fill="#fff" />
      </svg>

      {showWordmark ? (
        <span className="text-[16px] font-semibold text-[#161616]">
          Tube Watch
        </span>
      ) : null}
    </span>
  );
}
