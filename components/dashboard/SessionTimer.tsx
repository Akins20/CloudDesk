'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface SessionTimerProps {
  startTime: string;
  className?: string;
}

export function SessionTimer({ startTime, className = '' }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    const start = new Date(startTime).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.floor((now - start) / 1000);

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setElapsed(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className="w-4 h-4 text-status-success animate-pulse" />
      <span className="font-mono text-lg text-foreground tabular-nums">{elapsed}</span>
    </div>
  );
}
