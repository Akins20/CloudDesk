'use client';

import { Server, Wifi, Activity, Clock, History } from 'lucide-react';
import { AnimatedGauge } from './AnimatedGauge';
import { AnimatedMeter } from './AnimatedMeter';
import { HealthIndicator } from './HealthIndicator';
import { Instance } from '@/lib/types';

interface StatusDashboardProps {
  totalInstances: number;
  activeInstances: number;
  activeSessions: number;
  totalSessions: number;
  totalDuration: string;
  instances: Instance[];
}

export function StatusDashboard({
  totalInstances,
  activeInstances,
  activeSessions,
  totalSessions,
  totalDuration,
  instances,
}: StatusDashboardProps) {
  const healthItems = instances.map((instance) => ({
    id: instance.id,
    name: instance.name,
    status: instance.status as 'active' | 'inactive' | 'error' | 'warning',
  }));

  return (
    <div className="p-4 rounded-xl bg-card/50 border border-border/50 animate-panel-breathe">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
        <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">
          System Status
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gauges Section */}
        <div className="lg:col-span-5 flex items-center justify-around py-2">
          <AnimatedGauge
            value={activeInstances}
            maxValue={Math.max(totalInstances, 1)}
            label="Active"
            icon={Wifi}
            color={activeInstances > 0 ? 'success' : 'default'}
            size="md"
          />
          <AnimatedGauge
            value={activeSessions}
            maxValue={Math.max(totalInstances, 1)}
            label="Sessions"
            icon={Activity}
            color={activeSessions > 0 ? 'success' : 'default'}
            size="md"
          />
          <AnimatedGauge
            value={totalInstances}
            maxValue={20}
            label="Instances"
            icon={Server}
            color="default"
            size="md"
          />
        </div>

        {/* Meters Section */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
          <AnimatedMeter
            value={totalSessions}
            label="Total Sessions"
            icon={History}
          />
          <AnimatedMeter
            value={totalDuration}
            label="Session Time"
            icon={Clock}
            animate={false}
          />
        </div>

        {/* Health Matrix */}
        <div className="lg:col-span-3">
          <HealthIndicator items={healthItems} maxDisplay={12} />
        </div>
      </div>
    </div>
  );
}
