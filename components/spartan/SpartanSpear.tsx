import React from "react";

interface SpartanSpearProps {
  size?: number;
  className?: string;
}

const SpartanSpear: React.FC<SpartanSpearProps> = ({
  size = 200,
  className,
}) => {
  const id = React.useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 120"
      width={size}
      height={size * (120 / 400)}
      className={className}
    >
      <defs>
        <linearGradient id={`ss-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c47a3a" />
          <stop offset="50%" stopColor="#8b5e2f" />
          <stop offset="100%" stopColor="#6b4423" />
        </linearGradient>
        <linearGradient id={`sh-${id}`} x1="0" y1="0" x2="1" y2="0.5">
          <stop offset="0%" stopColor="#ffe680" />
          <stop offset="40%" stopColor="#d4a030" />
          <stop offset="100%" stopColor="#8b6914" />
        </linearGradient>
        <linearGradient id={`st-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f5d060" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
        <filter id={`spg-${id}`}>
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="3"
            floodColor="#f5a623"
            floodOpacity="0.4"
          />
        </filter>
      </defs>
      <g filter={`url(#spg-${id})`} transform="rotate(-15, 200, 60)">
        <rect x="60" y="55" width="280" height="10" rx="3" fill={`url(#ss-${id})`} />
        <line x1="60" y1="57" x2="340" y2="57" stroke="#d4955a" strokeWidth="1" opacity="0.4" />
        <path d="M340 60 L395 60 L340 40 Z" fill={`url(#sh-${id})`} stroke="#8b6914" strokeWidth="1" />
        <path d="M340 60 L395 60 L340 80 Z" fill={`url(#st-${id})`} stroke="#8b6914" strokeWidth="1" />
        <line x1="342" y1="60" x2="390" y2="60" stroke="#ffe680" strokeWidth="1" opacity="0.5" />
        <rect x="335" y="48" width="12" height="24" rx="2" fill="#8b6914" stroke="#6b4e10" strokeWidth="1" />
        <path d="M60 60 L30 55 L25 60 L30 65 Z" fill={`url(#sh-${id})`} stroke="#8b6914" strokeWidth="1" />
        <rect x="55" y="50" width="10" height="20" rx="2" fill="#8b6914" stroke="#6b4e10" strokeWidth="1" />
        <g opacity="0.6">
          {[180, 190, 200, 210, 220].map((x) => (
            <line key={x} x1={x} y1="54" x2={x + 5} y2="66" stroke="#5a3a18" strokeWidth="2" />
          ))}
        </g>
      </g>
    </svg>
  );
};

export default SpartanSpear;
