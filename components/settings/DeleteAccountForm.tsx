'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2, Lock } from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import { useAuthStore, toast } from '@/lib/stores';
import { ROUTES } from '@/lib/utils/constants';

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmDelete: z.literal('DELETE', { message: 'Please type DELETE to confirm' }),
});

type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;

export function DeleteAccountForm() {
  const router = useRouter();
  const { deleteAccount } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: '',
      confirmDelete: '' as 'DELETE',
    },
  });

  const onSubmit = async (data: DeleteAccountFormData) => {
    setIsLoading(true);
    try {
      const result = await deleteAccount({
        password: data.password,
        confirmDelete: data.confirmDelete,
      });
      toast.success('Account deleted successfully');
      setShowModal(false);
      reset();
      router.push(ROUTES.LOGIN);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-xl bg-red-500/5 border border-red-500/20 overflow-hidden">
        <div className="p-4 border-b border-red-500/20">
          <h3 className="text-sm font-medium text-red-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </h3>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-foreground">Delete Account</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>This will permanently delete:</p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li>Your user account</li>
                <li>All saved instances</li>
                <li>All session history</li>
                <li>All audit logs</li>
              </ul>
            </div>

            <Button
              variant="danger"
              onClick={() => setShowModal(true)}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          reset();
        }}
        title="Delete Account"
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-300">
              <p className="font-medium">This action is irreversible</p>
              <p className="mt-1 text-red-400">
                Once you delete your account, there is no going back. All your data will be permanently removed.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Password
            </label>
            <Input
              type="password"
              placeholder="Enter your password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Type DELETE to confirm
            </label>
            <Input
              type="text"
              placeholder="DELETE"
              error={errors.confirmDelete?.message}
              {...register('confirmDelete')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowModal(false);
                reset();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={isLoading}
              className="flex-1"
            >
              {!isLoading && <Trash2 className="w-4 h-4 mr-2" />}
              Delete Account
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
