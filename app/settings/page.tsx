'use client';

import { DashboardLayout } from '@/components/layout';
import { ProfileCard, ChangePasswordForm } from '@/components/settings';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProfileCard />
          <ChangePasswordForm />
        </div>
      </div>
    </DashboardLayout>
  );
}
