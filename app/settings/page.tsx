'use client';

import { User, Shield, Key, Bell, HelpCircle, Lock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { GridBackground } from '@/components/dashboard';
import { ProfileCard, ChangePasswordForm, DeleteAccountForm } from '@/components/settings';
import { InfoPanel } from '@/components/ui';

const aboutContent = (
  <div className="space-y-3 text-xs text-muted-foreground">
    <p>
      <span className="font-medium text-foreground">Account Settings</span>
      <br />
      Manage your profile information and security preferences. Keep your account secure by using a strong password.
    </p>
    <p>
      <span className="font-medium text-foreground">Profile Information</span>
      <br />
      Update your name and email. Your email is used for notifications and password recovery.
    </p>
    <p>
      <span className="font-medium text-foreground">Password Security</span>
      <br />
      Change your password regularly. Use a unique, strong password that you don't use elsewhere.
    </p>
  </div>
);

const securityContent = (
  <div className="space-y-3 text-xs text-muted-foreground">
    <div className="flex items-start gap-2">
      <Key className="w-4 h-4 text-status-success mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium text-foreground">Password Encryption</p>
        <p>Your password is hashed using bcrypt and never stored in plaintext.</p>
      </div>
    </div>
    <div className="flex items-start gap-2">
      <Shield className="w-4 h-4 text-status-info mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium text-foreground">Credential Protection</p>
        <p>SSH keys are encrypted with your password - we can never see them.</p>
      </div>
    </div>
    <div className="flex items-start gap-2">
      <Lock className="w-4 h-4 text-status-warning mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium text-foreground">Session Tokens</p>
        <p>JWT tokens expire after 15 minutes. Refresh tokens last 7 days.</p>
      </div>
    </div>
  </div>
);

const helpContent = (
  <div className="space-y-3 text-xs text-muted-foreground">
    <p>
      <span className="font-medium text-foreground">Forgot Password?</span>
      <br />
      Use the forgot password link on the login page to reset your password via email.
    </p>
    <p>
      <span className="font-medium text-foreground">Can't Update Email?</span>
      <br />
      Contact support if you need to change your account email address.
    </p>
    <p>
      <span className="font-medium text-foreground">Delete Account</span>
      <br />
      Use the Danger Zone section below to permanently delete your account and all data.
    </p>
  </div>
);

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="relative min-h-full">
        <GridBackground />

        <div className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main content - takes 3 columns */}
            <div className="lg:col-span-3 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Account Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your profile and security settings
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProfileCard />
                <ChangePasswordForm />
              </div>

              <div className="mt-6">
                <DeleteAccountForm />
              </div>
            </div>

            {/* Info Panel - takes 1 column */}
            <div className="space-y-4">
              <InfoPanel
                title="Settings"
                description="Manage your account"
                tabs={[
                  {
                    id: 'about',
                    label: 'About',
                    icon: <User className="w-3.5 h-3.5" />,
                    content: aboutContent,
                  },
                  {
                    id: 'security',
                    label: 'Security',
                    icon: <Shield className="w-3.5 h-3.5" />,
                    content: securityContent,
                  },
                  {
                    id: 'help',
                    label: 'Help',
                    icon: <HelpCircle className="w-3.5 h-3.5" />,
                    content: helpContent,
                  },
                ]}
                tips={[
                  'Use a strong, unique password',
                  'Update your password every 90 days',
                  'Never share your credentials with anyone',
                ]}
                securityNote="Your password is used to encrypt SSH credentials. If you change it, you may need to re-enter your instance credentials."
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
