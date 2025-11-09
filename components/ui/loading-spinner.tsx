"use client";

import React from "react";

interface Props {
  size?: number;
  className?: string;
}

export default function LoadingSpinner({ size = 32, className = "" }: Props) {
  const s = size;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 38 38"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      aria-hidden="true"
      className={className}
    >
      <g fill="none" fillRule="evenodd">
        <g transform="translate(1 1)" strokeWidth="2">
          <circle strokeOpacity="0.2" cx="18" cy="18" r="18" />
          <path d="M36 18c0-9.94-8.06-18-18-18">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 18 18"
              to="360 18 18"
              dur="1s"
              repeatCount="indefinite"
            />
          </path>
        </g>
      </g>
    </svg>
  );
}
