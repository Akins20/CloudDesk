'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Save } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuthStore, toast } from '@/lib/stores';
import { changePasswordSchema, type ChangePasswordFormData } from '@/lib/utils/validators';
import { SUCCESS_MESSAGES } from '@/lib/utils/constants';

export function ChangePasswordForm() {
  const { changePassword } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true);
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success(SUCCESS_MESSAGES.PASSWORD_CHANGED);
      reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-card/50 border border-border/50 animate-panel-breathe overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
          Change Password
        </h3>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Current Password
            </label>
            <Input
              type="password"
              placeholder="Enter your current password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              New Password
            </label>
            <Input
              type="password"
              placeholder="Enter your new password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.newPassword?.message}
              hint="At least 8 characters with uppercase, lowercase, number, and special character"
              {...register('newPassword')}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Confirm New Password
            </label>
            <Input
              type="password"
              placeholder="Confirm your new password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirmNewPassword?.message}
              {...register('confirmNewPassword')}
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {!isLoading && <Save className="w-4 h-4 mr-2" />}
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
