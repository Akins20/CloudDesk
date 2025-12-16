'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Input, toast } from '@/components/ui';
import { useAuthStore } from '@/lib/stores/auth.store';
import api, { ApiResponse } from '@/lib/api/client';

export default function SettingsPage() {
  const { customer, updateProfile, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profile, setProfile] = useState({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    organizationName: customer?.organizationName || '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile(profile);
      toast({ title: 'Profile updated', variant: 'success' });
    } catch (error) {
      toast({
        title: 'Failed to update profile',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (passwords.newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    setPasswordLoading(true);

    try {
      await api.post<ApiResponse<void>>('/customers/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      toast({ title: 'Password changed', description: 'Please log in again', variant: 'success' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });

      // Log out after password change
      setTimeout(() => {
        logout();
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      toast({
        title: 'Failed to change password',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8">
        Manage your account settings and preferences.
      </p>

      <div className="space-y-6 max-w-2xl">
        {/* Profile Settings */}
        <Card>
          <form onSubmit={handleProfileSubmit}>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                />
                <Input
                  label="Last Name"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                />
              </div>
              <Input
                label="Organization"
                value={profile.organizationName}
                onChange={(e) => setProfile({ ...profile, organizationName: e.target.value })}
              />
              <Input
                label="Email"
                value={customer?.email || ''}
                disabled
                helperText="Email cannot be changed"
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" isLoading={isLoading}>
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Password Change */}
        <Card>
          <form onSubmit={handlePasswordSubmit}>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                autoComplete="current-password"
              />
              <Input
                label="New Password"
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                helperText="At least 8 characters"
                autoComplete="new-password"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                autoComplete="new-password"
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" isLoading={passwordLoading}>
                Change Password
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account ID</span>
              <span className="font-mono">{customer?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member since</span>
              <span>{customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email verified</span>
              <span>{customer?.emailVerified ? 'Yes' : 'No'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
