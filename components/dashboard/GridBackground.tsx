'use client';

interface GridBackgroundProps {
  className?: string;
}

export function GridBackground({ className = '' }: GridBackgroundProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--foreground) / 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--foreground) / 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Animated sweep overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-y-0 w-[200%] animate-grid-sweep"
          style={{
            background: `linear-gradient(
              90deg,
              transparent 0%,
              hsl(var(--foreground) / 0.015) 25%,
              hsl(var(--foreground) / 0.03) 50%,
              hsl(var(--foreground) / 0.015) 75%,
              transparent 100%
            )`,
          }}
        />
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-20 h-20">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-foreground/20 to-transparent" />
        <div className="absolute top-0 left-0 h-full w-px bg-gradient-to-b from-foreground/20 to-transparent" />
      </div>
      <div className="absolute top-0 right-0 w-20 h-20">
        <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-l from-foreground/20 to-transparent" />
        <div className="absolute top-0 right-0 h-full w-px bg-gradient-to-b from-foreground/20 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 w-20 h-20">
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-foreground/20 to-transparent" />
        <div className="absolute bottom-0 left-0 h-full w-px bg-gradient-to-t from-foreground/20 to-transparent" />
      </div>
      <div className="absolute bottom-0 right-0 w-20 h-20">
        <div className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-l from-foreground/20 to-transparent" />
        <div className="absolute bottom-0 right-0 h-full w-px bg-gradient-to-t from-foreground/20 to-transparent" />
      </div>
    </div>
  );
}
