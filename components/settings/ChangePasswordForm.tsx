'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui';
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
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter your current password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />

          <Input
            label="New Password"
            type="password"
            placeholder="Enter your new password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.newPassword?.message}
            hint="At least 8 characters with uppercase, lowercase, number, and special character"
            {...register('newPassword')}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm your new password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.confirmNewPassword?.message}
            {...register('confirmNewPassword')}
          />

          <CardFooter className="px-0 pb-0">
            <Button type="submit" isLoading={isLoading}>
              Update Password
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
