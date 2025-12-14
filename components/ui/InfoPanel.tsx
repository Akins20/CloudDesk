'use client';

import { useState, ReactNode } from 'react';
import { ChevronRight, Info, Shield, Lightbulb, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

export interface InfoPanelStep {
  title: string;
  description: string;
  isComplete?: boolean;
  isCurrent?: boolean;
}

export interface InfoPanelTab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

export interface InfoPanelProps {
  title?: string;
  description?: string;
  steps?: InfoPanelStep[];
  tabs?: InfoPanelTab[];
  tips?: string[];
  securityNote?: string;
  className?: string;
}

export function InfoPanel({
  title,
  description,
  steps,
  tabs,
  tips,
  securityNote,
  className,
}: InfoPanelProps) {
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.id);

  return (
    <div
      className={cn(
        'rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden',
        className
      )}
    >
      {/* Header */}
      {(title || description) && (
        <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
          {title && (
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-foreground" />
              <h3 className="text-sm font-medium text-foreground">{title}</h3>
            </div>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <>
          <div className="flex border-b border-border/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
                  activeTab === tab.id
                    ? 'text-foreground border-b-2 border-foreground bg-muted/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-4">
            {tabs.find((t) => t.id === activeTab)?.content}
          </div>
        </>
      )}

      {/* Steps */}
      {steps && steps.length > 0 && !tabs && (
        <div className="p-4">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {step.isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-status-success" />
                  ) : step.isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-foreground flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-foreground" />
                    </div>
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      step.isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {tips && tips.length > 0 && (
        <div className="px-4 py-3 border-t border-border/50 bg-muted/10">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-status-warning" />
            <span className="text-xs font-medium text-foreground">Tips</span>
          </div>
          <ul className="space-y-1.5">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-xs text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Security Note */}
      {securityNote && (
        <div className="px-4 py-3 border-t border-border/50 bg-status-success/5">
          <div className="flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-status-success mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">{securityNote}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Pre-built content components for common use cases
export function StepsList({ steps }: { steps: InfoPanelStep[] }) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {step.isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-status-success" />
            ) : step.isCurrent ? (
              <div className="w-4 h-4 rounded-full border-2 border-foreground flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-foreground" />
              </div>
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-sm font-medium',
                step.isCurrent ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {step.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
