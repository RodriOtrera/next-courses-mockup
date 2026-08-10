import React from "react";

interface LaurelWreathProps {
  size?: number;
  className?: string;
}

const LaurelWreath: React.FC<LaurelWreathProps> = ({
  size = 120,
  className,
}) => {
  const id = React.useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 280"
      width={size}
      height={size * (280 / 300)}
      className={className}
    >
      <defs>
        <linearGradient id={`lg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d4a030" />
          <stop offset="50%" stopColor="#b8860b" />
          <stop offset="100%" stopColor="#8b6914" />
        </linearGradient>
        <linearGradient id={`ll-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e8b830" />
          <stop offset="100%" stopColor="#c49520" />
        </linearGradient>
        <filter id={`lwg-${id}`}>
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="4"
            floodColor="#d4a030"
            floodOpacity="0.4"
          />
        </filter>
      </defs>
      <g filter={`url(#lwg-${id})`}>
        {/* Left stem */}
        <path
          d="M148 260 C140 240, 120 200, 95 160 C70 120, 55 80, 60 50"
          fill="none"
          stroke="#8b6914"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Right stem */}
        <path
          d="M152 260 C160 240, 180 200, 205 160 C230 120, 245 80, 240 50"
          fill="none"
          stroke="#8b6914"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Left outer leaves */}
        {[
          { cx: 58, cy: 55, rx: 12, ry: 6, r: -60, light: false },
          { cx: 55, cy: 75, rx: 13, ry: 6, r: -50, light: true },
          { cx: 58, cy: 95, rx: 13, ry: 6, r: -45, light: false },
          { cx: 65, cy: 115, rx: 14, ry: 6, r: -40, light: true },
          { cx: 73, cy: 133, rx: 14, ry: 6, r: -35, light: false },
          { cx: 83, cy: 150, rx: 14, ry: 7, r: -30, light: true },
          { cx: 93, cy: 167, rx: 14, ry: 7, r: -25, light: false },
          { cx: 105, cy: 183, rx: 14, ry: 7, r: -20, light: true },
          { cx: 115, cy: 198, rx: 13, ry: 6, r: -15, light: false },
          { cx: 125, cy: 212, rx: 13, ry: 6, r: -10, light: true },
          { cx: 133, cy: 228, rx: 12, ry: 6, r: -5, light: false },
          { cx: 140, cy: 243, rx: 11, ry: 5, r: 0, light: true },
        ].map((l, i) => (
          <ellipse
            key={`l-${i}`}
            cx={l.cx}
            cy={l.cy}
            rx={l.rx}
            ry={l.ry}
            transform={`rotate(${l.r}, ${l.cx}, ${l.cy})`}
            fill={l.light ? `url(#ll-${id})` : `url(#lg-${id})`}
          />
        ))}

        {/* Right outer leaves */}
        {[
          { cx: 242, cy: 55, rx: 12, ry: 6, r: 60 },
          { cx: 245, cy: 75, rx: 13, ry: 6, r: 50 },
          { cx: 242, cy: 95, rx: 13, ry: 6, r: 45 },
          { cx: 235, cy: 115, rx: 14, ry: 6, r: 40 },
          { cx: 227, cy: 133, rx: 14, ry: 6, r: 35 },
          { cx: 217, cy: 150, rx: 14, ry: 7, r: 30 },
          { cx: 207, cy: 167, rx: 14, ry: 7, r: 25 },
          { cx: 195, cy: 183, rx: 14, ry: 7, r: 20 },
          { cx: 185, cy: 198, rx: 13, ry: 6, r: 15 },
          { cx: 175, cy: 212, rx: 13, ry: 6, r: 10 },
          { cx: 167, cy: 228, rx: 12, ry: 6, r: 5 },
          { cx: 160, cy: 243, rx: 11, ry: 5, r: 0 },
        ].map((l, i) => (
          <ellipse
            key={`r-${i}`}
            cx={l.cx}
            cy={l.cy}
            rx={l.rx}
            ry={l.ry}
            transform={`rotate(${l.r}, ${l.cx}, ${l.cy})`}
            fill={i % 2 === 0 ? `url(#lg-${id})` : `url(#ll-${id})`}
          />
        ))}

        {/* Inner leaves */}
        {[
          { cx: 72, cy: 62, r: 30 },
          { cx: 72, cy: 85, r: 35 },
          { cx: 78, cy: 108, r: 40 },
          { cx: 88, cy: 130, r: 45 },
          { cx: 100, cy: 150, r: 50 },
          { cx: 112, cy: 170, r: 55 },
        ].map((l, i) => (
          <ellipse
            key={`il-${i}`}
            cx={l.cx}
            cy={l.cy}
            rx="10"
            ry="5"
            transform={`rotate(${l.r}, ${l.cx}, ${l.cy})`}
            fill={`url(#lg-${id})`}
            opacity="0.7"
          />
        ))}
        {[
          { cx: 228, cy: 62, r: -30 },
          { cx: 228, cy: 85, r: -35 },
          { cx: 222, cy: 108, r: -40 },
          { cx: 212, cy: 130, r: -45 },
          { cx: 200, cy: 150, r: -50 },
          { cx: 188, cy: 170, r: -55 },
        ].map((l, i) => (
          <ellipse
            key={`ir-${i}`}
            cx={l.cx}
            cy={l.cy}
            rx="10"
            ry="5"
            transform={`rotate(${l.r}, ${l.cx}, ${l.cy})`}
            fill={`url(#lg-${id})`}
            opacity="0.7"
          />
        ))}
      </g>
    </svg>
  );
};

export default LaurelWreath;
