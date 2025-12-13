'use client';

import { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface AnimatedGaugeProps {
  value: number;
  maxValue: number;
  label: string;
  icon: LucideIcon;
  color?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

const colorVariants = {
  default: {
    stroke: 'stroke-foreground',
    text: 'text-foreground',
    glow: 'hsl(var(--foreground) / 0.3)',
  },
  success: {
    stroke: 'stroke-status-success',
    text: 'text-status-success',
    glow: 'hsl(var(--status-success) / 0.3)',
  },
  warning: {
    stroke: 'stroke-status-warning',
    text: 'text-status-warning',
    glow: 'hsl(var(--status-warning) / 0.3)',
  },
  error: {
    stroke: 'stroke-status-error',
    text: 'text-status-error',
    glow: 'hsl(var(--status-error) / 0.3)',
  },
};

const sizeVariants = {
  sm: { size: 80, strokeWidth: 6, textSize: 'text-lg', iconSize: 16 },
  md: { size: 100, strokeWidth: 8, textSize: 'text-xl', iconSize: 20 },
  lg: { size: 120, strokeWidth: 10, textSize: 'text-2xl', iconSize: 24 },
};

export function AnimatedGauge({
  value,
  maxValue,
  label,
  icon: Icon,
  color = 'default',
  size = 'md',
}: AnimatedGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const colors = colorVariants[color];
  const sizes = sizeVariants[size];

  const radius = (sizes.size - sizes.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = maxValue > 0 ? Math.min(animatedValue / maxValue, 1) : 0;
  const offset = circumference - percentage * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: sizes.size, height: sizes.size }}>
        {/* Glow effect behind gauge */}
        {animatedValue > 0 && (
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-30"
            style={{ backgroundColor: colors.glow }}
          />
        )}

        <svg
          width={sizes.size}
          height={sizes.size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={sizes.size / 2}
            cy={sizes.size / 2}
            r={radius}
            fill="none"
            strokeWidth={sizes.strokeWidth}
            className="stroke-muted"
          />

          {/* Progress circle */}
          <circle
            cx={sizes.size / 2}
            cy={sizes.size / 2}
            r={radius}
            fill="none"
            strokeWidth={sizes.strokeWidth}
            strokeLinecap="round"
            className={`${colors.stroke} transition-all duration-1000 ease-out`}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              filter: animatedValue > 0 ? `drop-shadow(0 0 6px ${colors.glow})` : 'none',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon size={sizes.iconSize} className={`${colors.text} mb-0.5`} />
          <span className={`font-bold ${colors.text} ${sizes.textSize}`}>
            {animatedValue}
          </span>
        </div>
      </div>

      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
