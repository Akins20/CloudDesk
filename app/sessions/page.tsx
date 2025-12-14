'use client';

import { useEffect } from 'react';
import { Monitor, Clock, History, Shield, HelpCircle, Zap } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { GridBackground } from '@/components/dashboard';
import { SessionList } from '@/components/sessions';
import { InfoPanel } from '@/components/ui';
import { useSessionStore } from '@/lib/stores';

const aboutContent = (
  <div className="space-y-3 text-xs text-muted-foreground">
    <p>
      <span className="font-medium text-foreground">What are Sessions?</span>
      <br />
      Sessions are your active and past VNC connections to cloud instances. Each session represents a remote desktop connection.
    </p>
    <p>
      <span className="font-medium text-foreground">Session States</span>
      <br />
      <span className="text-status-success">Active</span> - Currently connected.
      {' '}<span className="text-status-warning">Connecting</span> - Establishing connection.
      {' '}<span className="text-muted-foreground">Disconnected</span> - Session ended.
    </p>
    <p>
      <span className="font-medium text-foreground">Session Timeout</span>
      <br />
      Idle sessions automatically disconnect after 30 minutes to save resources and improve security.
    </p>
  </div>
);

const historyContent = (
  <div className="space-y-3 text-xs text-muted-foreground">
    <p>
      <span className="font-medium text-foreground">Session History</span>
      <br />
      View your past connections including start time, duration, and which instance was accessed.
    </p>
    <p>
      <span className="font-medium text-foreground">Audit Trail</span>
      <br />
      Session history helps you track who connected and when for security purposes.
    </p>
    <p>
      <span className="font-medium text-foreground">Data Retention</span>
      <br />
      Session logs are retained for 30 days for your reference and security auditing.
    </p>
  </div>
);

const securityContent = (
  <div className="space-y-3 text-xs text-muted-foreground">
    <div className="flex items-start gap-2">
      <Shield className="w-4 h-4 text-status-success mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium text-foreground">Encrypted Connections</p>
        <p>All VNC traffic is tunneled through SSH for end-to-end security.</p>
      </div>
    </div>
    <div className="flex items-start gap-2">
      <Zap className="w-4 h-4 text-status-warning mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium text-foreground">Auto-Disconnect</p>
        <p>Sessions automatically end when idle to protect your instances.</p>
      </div>
    </div>
    <div className="flex items-start gap-2">
      <Monitor className="w-4 h-4 text-status-info mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium text-foreground">Session Isolation</p>
        <p>Each session runs in its own container for complete isolation.</p>
      </div>
    </div>
  </div>
);

export default function SessionsPage() {
  const { fetchSessionHistory, fetchActiveSessions } = useSessionStore();

  useEffect(() => {
    // Fetch both active sessions and session history
    fetchActiveSessions();
    fetchSessionHistory({ limit: 50 });
  }, [fetchSessionHistory, fetchActiveSessions]);

  return (
    <DashboardLayout>
      <div className="relative min-h-full">
        <GridBackground />

        <div className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main content - takes 3 columns */}
            <div className="lg:col-span-3 space-y-6">
              <SessionList />
            </div>

            {/* Info Panel - takes 1 column */}
            <div className="space-y-4">
              <InfoPanel
                title="Your Sessions"
                description="Monitor VNC connections"
                tabs={[
                  {
                    id: 'about',
                    label: 'About',
                    icon: <Monitor className="w-3.5 h-3.5" />,
                    content: aboutContent,
                  },
                  {
                    id: 'history',
                    label: 'History',
                    icon: <History className="w-3.5 h-3.5" />,
                    content: historyContent,
                  },
                  {
                    id: 'security',
                    label: 'Security',
                    icon: <Shield className="w-3.5 h-3.5" />,
                    content: securityContent,
                  },
                ]}
                tips={[
                  'End idle sessions to free up resources',
                  'Check session history for security audit',
                  'Sessions auto-disconnect after 30 min idle',
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
