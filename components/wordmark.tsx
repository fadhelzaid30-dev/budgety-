const VARIANTS = {
  dark: { markFrom: "#2D2A6E", markTo: "#6C63FF", textColor: "#2D2A6E" },
  light: { markFrom: "#8F88FF", markTo: "#6C63FF", textColor: "#F5F4FB" },
} as const;

/** The standalone "B" mark (two offset solid lobes), no wordmark text. */
export function LogoMark({
  variant = "dark",
  size = 20,
  className,
}: {
  variant?: keyof typeof VARIANTS;
  size?: number;
  className?: string;
}) {
  const { markFrom, markTo } = VARIANTS[variant];
  const gradientId = `bgy-mark-standalone-${variant}`;
  const width = Math.round((size * 17) / 22);
  const height = Math.round((size * 24) / 22);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 34"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={markFrom} />
          <stop offset="1" stopColor={markTo} />
        </linearGradient>
      </defs>
      <path d="M0 0h5.5a7.5 7.5 0 0 1 0 15H0V0Z" fill={`url(#${gradientId})`} />
      <path d="M0 15h6.5a9.5 9.5 0 0 1 0 19H0V15Z" fill={`url(#${gradientId})`} />
    </svg>
  );
}

export function WordMark({
  variant = "dark",
  size = 20,
  className,
}: {
  variant?: keyof typeof VARIANTS;
  size?: number;
  className?: string;
}) {
  const { textColor } = VARIANTS[variant];

  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
      <LogoMark variant={variant} size={size} />
      <span
        style={{
          fontFamily: "var(--font-dm-sans), var(--font-geist-sans), sans-serif",
          fontSize: size,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          color: textColor,
        }}
      >
        budge
        <span
          style={{
            background: "var(--gradient-warm)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          t
        </span>
        y
      </span>
    </span>
  );
}
