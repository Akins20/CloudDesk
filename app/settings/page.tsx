'use client';

import { DashboardLayout } from '@/components/layout';
import { GridBackground } from '@/components/dashboard';
import { ProfileCard, ChangePasswordForm } from '@/components/settings';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="relative min-h-full">
        <GridBackground />

        <div className="relative z-10 space-y-6">
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
        </div>
      </div>
    </DashboardLayout>
  );
}
