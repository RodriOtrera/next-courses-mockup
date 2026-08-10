import React from "react";

interface GreekMeanderDividerProps {
  width?: number;
  className?: string;
  color?: string;
}

const GreekMeanderDivider: React.FC<GreekMeanderDividerProps> = ({
  width = 300,
  className,
  color = "#d4a030",
}) => {
  const id = React.useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 24"
      width={width}
      height={width * (24 / 300)}
      className={className}
    >
      <defs>
        <linearGradient id={`mg-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="20%" stopColor={color} stopOpacity="1" />
          <stop offset="80%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1="2" x2="300" y2="2" stroke={`url(#mg-${id})`} strokeWidth="1.5" />
      <line x1="0" y1="22" x2="300" y2="22" stroke={`url(#mg-${id})`} strokeWidth="1.5" />
      <g fill="none" stroke={`url(#mg-${id})`} strokeWidth="1.5">
        <path d="M0 4 L0 20 L15 20 L15 9 L5 9 L5 16 L11 16 L11 4 L25 4 L25 20 L40 20 L40 9 L30 9 L30 16 L36 16 L36 4 L50 4 L50 20 L65 20 L65 9 L55 9 L55 16 L61 16 L61 4 L75 4 L75 20 L90 20 L90 9 L80 9 L80 16 L86 16 L86 4 L100 4 L100 20 L115 20 L115 9 L105 9 L105 16 L111 16 L111 4 L125 4 L125 20 L140 20 L140 9 L130 9 L130 16 L136 16 L136 4 L150 4 L150 20 L165 20 L165 9 L155 9 L155 16 L161 16 L161 4 L175 4 L175 20 L190 20 L190 9 L180 9 L180 16 L186 16 L186 4 L200 4 L200 20 L215 20 L215 9 L205 9 L205 16 L211 16 L211 4 L225 4 L225 20 L240 20 L240 9 L230 9 L230 16 L236 16 L236 4 L250 4 L250 20 L265 20 L265 9 L255 9 L255 16 L261 16 L261 4 L275 4 L275 20 L290 20 L290 9 L280 9 L280 16 L286 16 L286 4 L300 4" />
      </g>
    </svg>
  );
};

export default GreekMeanderDivider;
