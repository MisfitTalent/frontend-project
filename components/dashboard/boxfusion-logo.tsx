"use client";

export function BoxfusionLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      aria-hidden
      fill="none"
      height={size}
      viewBox="0 0 48 48"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="#E7EDF4" height="48" rx="14" width="48" />
      <path
        d="M12 30.5L24 10L36 30.5L30.2 30.5L24 19.6L17.8 30.5H12Z"
        fill="#1F365C"
      />
      <path
        d="M24 19.6L30.2 30.5H36L24 38L12 30.5H17.8L24 19.6Z"
        fill="#F28C28"
      />
      <circle cx="24" cy="30.5" fill="#FFFFFF" r="2.6" />
    </svg>
  );
}
