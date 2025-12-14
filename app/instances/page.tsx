'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Server, Monitor, Shield, Zap, HelpCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { GridBackground, InstanceListPanel } from '@/components/dashboard';
import { Button, InfoPanel } from '@/components/ui';
import { useInstanceStore } from '@/lib/stores';
import { ROUTES } from '@/lib/utils/constants';

const aboutContent = (
  <div className="space-y-3 text-xs text-muted-foreground">
    <p>
      <span className="font-medium text-foreground">What are Instances?</span>
      <br />
      Instances are your cloud servers (EC2, OCI, etc.) that you've configured for remote desktop access via VNC.
    </p>
    <p>
      <span className="font-medium text-foreground">Manage Your Servers</span>
      <br />
      Add, edit, or remove instances. Click connect to start a VNC session with any instance.
    </p>
    <p>
      <span className="font-medium text-foreground">Status Indicators</span>
      <br />
      <span className="text-status-success">Active</span> - Ready for connection.
      {' '}<span className="text-status-warning">Connecting</span> - Session starting.
      {' '}<span className="text-muted-foreground">Inactive</span> - Disabled by you.
    </p>
  </div>
);

const quickActions = (
  <div className="space-y-2 text-xs">
    <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
      <Monitor className="w-4 h-4 text-status-info mt-0.5" />
      <div>
        <p className="font-medium text-foreground">Connect to Instance</p>
        <p className="text-muted-foreground">Click the connect button on any instance</p>
      </div>
    </div>
    <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
      <Shield className="w-4 h-4 text-status-success mt-0.5" />
      <div>
        <p className="font-medium text-foreground">Edit Credentials</p>
        <p className="text-muted-foreground">Update SSH keys securely anytime</p>
      </div>
    </div>
    <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
      <Zap className="w-4 h-4 text-status-warning mt-0.5" />
      <div>
        <p className="font-medium text-foreground">Quick Connect</p>
        <p className="text-muted-foreground">Double-click an instance to connect</p>
      </div>
    </div>
  </div>
);

export default function InstancesPage() {
  const router = useRouter();
  const { instances, fetchInstances } = useInstanceStore();

  useEffect(() => {
    fetchInstances({ limit: 100 });
  }, [fetchInstances]);

  return (
    <DashboardLayout>
      <div className="relative min-h-full">
        <GridBackground />

        <div className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main content - takes 3 columns */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">All Instances</h2>
                  <p className="text-sm text-muted-foreground">
                    {instances?.length || 0} total
                  </p>
                </div>
                <Button
                  onClick={() => router.push(ROUTES.INSTANCE_NEW)}
                  className="relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <Plus className="w-4 h-4 mr-2" />
                  Add Instance
                </Button>
              </div>

              <InstanceListPanel
                instances={instances || []}
                onRefresh={() => fetchInstances({ limit: 100 })}
              />
            </div>

            {/* Info Panel - takes 1 column */}
            <div className="space-y-4">
              <InfoPanel
                title="Your Instances"
                description="Manage remote desktop connections"
                tabs={[
                  {
                    id: 'about',
                    label: 'About',
                    icon: <Server className="w-3.5 h-3.5" />,
                    content: aboutContent,
                  },
                  {
                    id: 'actions',
                    label: 'Quick Actions',
                    icon: <Zap className="w-3.5 h-3.5" />,
                    content: quickActions,
                  },
                  {
                    id: 'help',
                    label: 'Help',
                    icon: <HelpCircle className="w-3.5 h-3.5" />,
                    content: (
                      <div className="text-xs text-muted-foreground space-y-2">
                        <p><span className="font-medium text-foreground">Can't connect?</span> Check if your instance is running and firewall allows connections.</p>
                        <p><span className="font-medium text-foreground">Need VNC installed?</span> We'll automatically install it on first connection.</p>
                        <p><span className="font-medium text-foreground">Session expired?</span> Your credentials may need to be re-entered.</p>
                      </div>
                    ),
                  },
                ]}
                tips={[
                  'Keep your SSH keys secure',
                  'Use tags to organize instances',
                  'Check instance status before connecting',
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
