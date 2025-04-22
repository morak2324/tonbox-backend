import React from 'react';

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  square?: boolean;
}

export function CircularProgress({
  progress,
  size = 144,
  strokeWidth = 4,
  className = '',
  square = false
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 ${className}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      {square ? (
        <>
          <rect
            className="stroke-purple-500/20"
            strokeWidth={strokeWidth}
            fill="none"
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={size - strokeWidth}
            height={size - strokeWidth}
          />
          <rect
            className="stroke-blue-400 transition-all duration-500 animate-pulse"
            strokeWidth={strokeWidth}
            strokeLinecap="square"
            fill="none"
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={size - strokeWidth}
            height={size - strokeWidth}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              filter: 'drop-shadow(0 0 6px rgba(96, 165, 250, 0.7))'
            }}
          />
        </>
      ) : (
        <>
          <circle
            className="stroke-purple-500/20"
            strokeWidth={strokeWidth}
            fill="none"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className="stroke-blue-400 transition-all duration-500 animate-pulse"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              filter: 'drop-shadow(0 0 6px rgba(96, 165, 250, 0.7))'
            }}
          />
        </>
      )}
    </svg>
  );
}