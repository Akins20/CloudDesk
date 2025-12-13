'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/helpers';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-muted text-muted-foreground',
      success: 'bg-status-success/10 text-status-success',
      warning: 'bg-status-warning/10 text-status-warning',
      error: 'bg-status-error/10 text-status-error',
      info: 'bg-status-info/10 text-status-info',
    };

    const sizes = {
      sm: 'px-1.5 py-0.5 text-xs',
      md: 'px-2 py-1 text-xs',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-md',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'active' | 'inactive' | 'connecting' | 'connected' | 'disconnected' | 'error';
}

const statusVariants: Record<StatusBadgeProps['status'], BadgeProps['variant']> = {
  active: 'success',
  inactive: 'default',
  connecting: 'warning',
  connected: 'success',
  disconnected: 'default',
  error: 'error',
};

const statusLabels: Record<StatusBadgeProps['status'], string> = {
  active: 'Active',
  inactive: 'Inactive',
  connecting: 'Connecting',
  connected: 'Connected',
  disconnected: 'Disconnected',
  error: 'Error',
};

const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, className, ...props }, ref) => {
    return (
      <Badge
        ref={ref}
        variant={statusVariants[status]}
        className={cn('gap-1.5', className)}
        {...props}
      >
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            status === 'active' || status === 'connected'
              ? 'bg-status-success animate-pulse'
              : status === 'connecting'
              ? 'bg-status-warning animate-pulse'
              : status === 'error'
              ? 'bg-status-error'
              : 'bg-muted-foreground'
          )}
        />
        {statusLabels[status]}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export { Badge, StatusBadge };
