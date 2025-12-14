'use client';

import { Server, Shield, Key, FileCode, HelpCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { InstanceForm } from '@/components/instances';
import { InfoPanel, StepsList } from '@/components/ui';

const howItWorksSteps = [
  {
    title: '1. Enter connection details',
    description: 'Provide your instance host, port, and username for SSH access.',
    isCurrent: true,
  },
  {
    title: '2. Add authentication',
    description: 'Enter your SSH private key or password for secure authentication.',
  },
  {
    title: '3. Encrypt with your password',
    description: 'Your credentials are encrypted locally with your account password.',
  },
  {
    title: '4. Securely stored',
    description: 'Encrypted credentials are stored - we can never see them in plaintext.',
  },
];

const securityInfo = (
  <div className="space-y-3 text-xs">
    <div className="flex items-start gap-2">
      <Shield className="w-4 h-4 text-status-success mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium text-foreground">Secure Transmission</p>
        <p className="text-muted-foreground mt-0.5">
          Your SSH keys and passwords are transmitted over HTTPS and encrypted before storage.
        </p>
      </div>
    </div>
    <div className="flex items-start gap-2">
      <Key className="w-4 h-4 text-status-info mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium text-foreground">Encrypted Storage</p>
        <p className="text-muted-foreground mt-0.5">
          Credentials are encrypted at rest. Plaintext exists only briefly in memory during sessions.
        </p>
      </div>
    </div>
    <div className="flex items-start gap-2">
      <FileCode className="w-4 h-4 text-status-warning mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium text-foreground">Secure Connection</p>
        <p className="text-muted-foreground mt-0.5">
          All data is transmitted over HTTPS. SSH tunnels protect your VNC sessions.
        </p>
      </div>
    </div>
  </div>
);

const helpContent = (
  <div className="space-y-3 text-xs text-muted-foreground">
    <p>
      <span className="font-medium text-foreground">What is an instance?</span>
      <br />
      An instance is a remote server (EC2, OCI, etc.) that you can connect to via VNC for desktop access.
    </p>
    <p>
      <span className="font-medium text-foreground">SSH Key vs Password?</span>
      <br />
      SSH keys are more secure and recommended. Use a password only if your server doesn't support key authentication.
    </p>
    <p>
      <span className="font-medium text-foreground">How do I get my SSH key?</span>
      <br />
      Your SSH private key is typically stored at <code className="text-xs bg-muted px-1 py-0.5 rounded">~/.ssh/id_rsa</code> or provided by your cloud provider.
    </p>
  </div>
);

export default function NewInstancePage() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form - takes 2 columns */}
        <div className="lg:col-span-2">
          <InstanceForm mode="create" />
        </div>

        {/* Info Panel - takes 1 column */}
        <div className="space-y-4">
          <InfoPanel
            title="Add New Instance"
            description="Connect to your cloud server"
            tabs={[
              {
                id: 'how',
                label: 'How it works',
                icon: <Server className="w-3.5 h-3.5" />,
                content: <StepsList steps={howItWorksSteps} />,
              },
              {
                id: 'security',
                label: 'Security',
                icon: <Shield className="w-3.5 h-3.5" />,
                content: securityInfo,
              },
              {
                id: 'help',
                label: 'Help',
                icon: <HelpCircle className="w-3.5 h-3.5" />,
                content: helpContent,
              },
            ]}
            tips={[
              'Use SSH keys instead of passwords for better security',
              'Make sure your firewall allows SSH (port 22) connections',
              'Test your connection before adding to ensure credentials work',
            ]}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
