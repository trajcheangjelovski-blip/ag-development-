// AG Development brand mark — gradient monogram
// Used in the public header, footer, and exported as favicon (src/app/icon.svg)

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AG Development logo"
    >
      <defs>
        <linearGradient id="agLogoGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#agLogoGrad)" />
      {/* subtle top gloss */}
      <path d="M0 0 H64 V18 Q32 28 0 18 Z" fill="white" opacity="0.07" />
      {/* A */}
      <path
        d="M13.5 43 L21.5 21 L29.5 43 M17 35.5 H26"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* G */}
      <path
        d="M50.5 25 A10 10 0 1 0 50.5 39 L50.5 32 H44.5"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
