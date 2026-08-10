import React from "react";

interface SpartanShieldProps {
  size?: number;
  className?: string;
}

const SpartanShield: React.FC<SpartanShieldProps> = ({
  size = 80,
  className,
}) => {
  const id = React.useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 350 350"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <radialGradient id={`sg-${id}`} cx="0.45" cy="0.4" r="0.55">
          <stop offset="0%" stopColor="#ffe066" />
          <stop offset="40%" stopColor="#f5b731" />
          <stop offset="75%" stopColor="#d4911a" />
          <stop offset="100%" stopColor="#a06b0f" />
        </radialGradient>
        <radialGradient id={`si-${id}`} cx="0.45" cy="0.4" r="0.5">
          <stop offset="0%" stopColor="#f5c842" />
          <stop offset="100%" stopColor="#c48a15" />
        </radialGradient>
        <linearGradient id={`lr-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cc1133" />
          <stop offset="100%" stopColor="#7a0a1e" />
        </linearGradient>
        <filter id={`sgl-${id}`}>
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="8"
            floodColor="#f5a623"
            floodOpacity="0.5"
          />
        </filter>
      </defs>
      <g filter={`url(#sgl-${id})`}>
        <circle cx="175" cy="175" r="150" fill="#8b6914" stroke="#5a4510" strokeWidth="3" />
        <circle cx="175" cy="175" r="142" fill={`url(#sg-${id})`} />
        <circle cx="175" cy="175" r="125" fill="none" stroke="#c48a15" strokeWidth="4" />
        <circle cx="175" cy="175" r="118" fill={`url(#si-${id})`} />
        <path
          d="M175 70 L230 265 L210 265 L175 130 L140 265 L120 265 Z"
          fill={`url(#lr-${id})`}
          stroke="#6b0a1e"
          strokeWidth="2"
        />
        <path
          d="M175 85 L222 260 L212 260 L175 140 L138 260 L128 260 Z"
          fill="none"
          stroke="#dd3355"
          strokeWidth="1"
          opacity="0.4"
        />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 175 + 147 * Math.cos(rad);
          const cy = 175 + 147 * Math.sin(rad);
          return (
            <circle
              key={angle}
              cx={cx}
              cy={cy}
              r="5"
              fill="#daa520"
              stroke="#8b6914"
              strokeWidth="1.5"
            />
          );
        })}
        <path
          d="M100 80 A120 120 0 0 1 250 80"
          fill="none"
          stroke="#ffe680"
          strokeWidth="2"
          opacity="0.3"
        />
      </g>
    </svg>
  );
};

export default SpartanShield;
