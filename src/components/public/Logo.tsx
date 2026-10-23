// AG Development brand mark — the logo icon PNG (public/logo-icon.png)
// Used in the public header, footer, promo popup and portal sidebar.
// The same image is the favicon (src/app/icon.png, src/app/apple-icon.png).
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-icon.png"
      width={size}
      height={size}
      alt="AG Development logo"
      className={className}
    />
  )
}
