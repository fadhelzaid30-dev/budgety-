import { cn } from "@/lib/utils";

/** A single ring of orbiting content, positioned absolutely within a relative parent. */
export function OrbitingCircles({
  children,
  className,
  reverse = false,
  duration = 20,
  delay = 0,
  radius = 100,
  showPath = true,
}: {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
  showPath?: boolean;
}) {
  return (
    <>
      {showPath ? (
        <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
          <circle
            className="stroke-white/10"
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            strokeWidth={1}
          />
        </svg>
      ) : null}
      <div
        style={
          {
            "--orbit-duration": duration,
            "--orbit-radius": radius,
            "--orbit-delay": delay,
          } as React.CSSProperties
        }
        className={cn(
          "animate-auth-orbit absolute flex size-full transform-gpu items-center justify-center rounded-full",
          reverse && "animate-auth-orbit-reverse",
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}
