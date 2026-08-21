/** Concentric ripple rings for the auth panel background. Violet-tinted, decorative only. */
export function Ripple({
  mainCircleSize = 120,
  mainCircleOpacity = 0.14,
  numCircles = 6,
  className,
}: {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center [mask-image:radial-gradient(closest-side,white,transparent)] ${className ?? ""}`}
      aria-hidden="true"
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 64;
        const opacity = mainCircleOpacity - i * 0.018;
        return (
          <span
            key={i}
            className="animate-auth-ripple absolute rounded-full border"
            style={{
              width: size,
              height: size,
              opacity,
              animationDelay: `${i * 0.08}s`,
              borderColor: "rgba(108, 99, 255, 0.35)",
              borderWidth: 1,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </div>
  );
}
