import React from 'react'

const SvgPath1 = () => {
  return (
    <div className="relative w-full">
        <svg
          width="100%"
          className="absolute"
          viewBox="0 0 1280 430"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.5 1.5C549.5 12 151.5 212.5 1284.5 186M0.5 428C620 428 304.5 292 1284.5 292"
            stroke="#151515"
            stroke-width="8"
          />
        </svg>
        <svg
          className="absolute "
          width="100%"
          viewBox="0 0 1280 430"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gradient">
              <stop offset={0} stopColor="white" stopOpacity={0} />
              <stop offset={0.8} stopColor="white" stopOpacity={1} />
              <stop offset={0.8} stopColor="white" stopOpacity={0} />
            </linearGradient>{" "}
            <linearGradient id="gradientPath" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="blue" />
              <stop offset="100%" stop-color="white" />
            </linearGradient>
            <mask id="gradient-mask">
              <rect
                className="mask-rect svgPath"
                x="0"
                strokeLinecap="round"
                y={0}
                width="100%"
                height="100%"
                fill="url(#gradient)"
              />
            </mask>
          </defs>

          <path
            className="pathSvg"
            strokeLinecap="round"
            stroke="url(#gradientPath)"
            mask="url(#gradient-mask)"
            d="M0.5 1.5C549.5 12 151.5 212.5 1284.5 186M0.5 428C620 428 304.5 292 1284.5 292"
            stroke-width="8"
          />
        </svg>
      </div>
  )
}

export default SvgPath1