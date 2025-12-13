'use client';

interface HealthIndicatorProps {
  items: {
    id: string;
    name: string;
    status: 'active' | 'inactive' | 'error' | 'warning';
  }[];
  maxDisplay?: number;
}

const statusColors = {
  active: 'bg-status-success',
  inactive: 'bg-muted-foreground/30',
  error: 'bg-status-error',
  warning: 'bg-status-warning',
};

const statusGlow = {
  active: 'shadow-[0_0_8px_hsl(var(--status-success)/0.5)]',
  inactive: '',
  error: 'shadow-[0_0_8px_hsl(var(--status-error)/0.5)]',
  warning: 'shadow-[0_0_8px_hsl(var(--status-warning)/0.5)]',
};

export function HealthIndicator({ items, maxDisplay = 12 }: HealthIndicatorProps) {
  const displayItems = items.slice(0, maxDisplay);
  const activeCount = items.filter((i) => i.status === 'active').length;
  const errorCount = items.filter((i) => i.status === 'error').length;

  return (
    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          System Health
        </span>
        <div className="flex gap-3 text-xs">
          <span className="text-status-success">{activeCount} online</span>
          {errorCount > 0 && (
            <span className="text-status-error">{errorCount} issues</span>
          )}
        </div>
      </div>

      {/* Health matrix */}
      <div className="grid grid-cols-6 gap-2">
        {displayItems.map((item) => (
          <div
            key={item.id}
            className="relative group"
          >
            <div
              className={`
                w-full aspect-square rounded-sm
                ${statusColors[item.status]}
                ${item.status === 'active' ? 'animate-pulse' : ''}
                ${statusGlow[item.status]}
                transition-all duration-200
              `}
            />

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {item.name}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-popover" />
            </div>
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, maxDisplay - displayItems.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="w-full aspect-square rounded-sm bg-muted/20 border border-dashed border-border/30"
          />
        ))}
      </div>

      {items.length > maxDisplay && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          +{items.length - maxDisplay} more instances
        </p>
      )}
    </div>
  );
}
