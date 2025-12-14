'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Server, Globe, User, Tag, X, Lock, ShieldCheck } from 'lucide-react';
import { Button, Input, Select, Textarea, Card, CardHeader, CardTitle, CardContent, CardFooter, PasswordPrompt } from '@/components/ui';
import { useInstanceStore, toast } from '@/lib/stores';
import { createInstanceSchema, updateInstanceSchema, type CreateInstanceFormData, type UpdateInstanceFormData } from '@/lib/utils/validators';
import { ROUTES, SUCCESS_MESSAGES, CLOUD_PROVIDERS, AUTH_TYPES, VALIDATION } from '@/lib/utils/constants';
import { encryptWithPassword } from '@/lib/utils/crypto';
import type { Instance, CloudProvider, AuthType } from '@/lib/types';

interface InstanceFormProps {
  instance?: Instance;
  mode: 'create' | 'edit';
}

export function InstanceForm({ instance, mode }: InstanceFormProps) {
  const router = useRouter();
  const { createInstance, updateInstance, isCreating, isUpdating } = useInstanceStore();
  const [tagInput, setTagInput] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<CreateInstanceFormData | null>(null);
  const [passwordError, setPasswordError] = useState('');

  const isEdit = mode === 'edit';
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateInstanceFormData>({
    resolver: zodResolver(isEdit ? updateInstanceSchema : createInstanceSchema) as any,
    defaultValues: isEdit && instance
      ? {
          name: instance.name,
          provider: instance.provider,
          host: instance.host,
          port: instance.port,
          username: instance.username,
          authType: instance.authType,
          credential: '',
          tags: instance.tags,
        }
      : {
          name: '',
          provider: 'ec2' as CloudProvider,
          host: '',
          port: 22,
          username: '',
          authType: 'key' as AuthType,
          credential: '',
          tags: [],
        },
  });

  const authType = watch('authType');
  const tags = watch('tags') || [];

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (
      trimmedTag &&
      !tags.includes(trimmedTag) &&
      tags.length < VALIDATION.TAG.MAX_TAGS
    ) {
      setValue('tags', [...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      'tags',
      tags.filter((t: string) => t !== tagToRemove)
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const onSubmit = async (data: CreateInstanceFormData) => {
    // If credential is provided, prompt for password to encrypt it
    if (data.credential && data.credential.trim()) {
      setPendingFormData(data);
      setPasswordError('');
      setShowPasswordPrompt(true);
      return;
    }

    // No credential change, submit directly (for edit mode)
    await submitForm(data);
  };

  const submitForm = async (data: CreateInstanceFormData) => {
    try {
      if (isEdit && instance) {
        await updateInstance(instance.id, data as UpdateInstanceFormData);
        toast.success(SUCCESS_MESSAGES.INSTANCE_UPDATED);
      } else {
        await createInstance(data);
        toast.success(SUCCESS_MESSAGES.INSTANCE_CREATED);
      }
      router.push(ROUTES.INSTANCES);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to ${isEdit ? 'update' : 'create'} instance`;
      toast.error(message);
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!pendingFormData) return;

    try {
      setPasswordError('');

      // Encrypt the credential with user's password
      const encryptedCredential = await encryptWithPassword(
        pendingFormData.credential,
        password
      );

      // Submit with encrypted credential
      const dataToSubmit = {
        ...pendingFormData,
        credential: encryptedCredential,
      };

      await submitForm(dataToSubmit);
      setShowPasswordPrompt(false);
      setPendingFormData(null);
    } catch (error) {
      setPasswordError('Failed to encrypt credential. Please try again.');
    }
  };

  const providerOptions = Object.entries(CLOUD_PROVIDERS).map(([value, info]) => ({
    value,
    label: info.label,
  }));

  const authTypeOptions = Object.entries(AUTH_TYPES).map(([value, info]) => ({
    value,
    label: info.label,
  }));

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Instance' : 'Add New Instance'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Row 1: Name, Provider, Host, Port */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              label="Instance Name"
              placeholder="My Cloud Server"
              leftIcon={<Server className="w-4 h-4" />}
              error={errors.name?.message}
              {...register('name')}
            />

            <Controller
              name="provider"
              control={control}
              render={({ field }) => (
                <Select
                  label="Cloud Provider"
                  options={providerOptions}
                  error={errors.provider?.message}
                  {...field}
                />
              )}
            />

            <Input
              label="Host"
              placeholder="192.168.1.1"
              leftIcon={<Globe className="w-4 h-4" />}
              error={errors.host?.message}
              {...register('host')}
            />

            <Input
              label="SSH Port"
              type="number"
              placeholder="22"
              error={errors.port?.message}
              {...register('port', { valueAsNumber: true })}
            />
          </div>

          {/* Row 2: Username, Auth Type, Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              label="Username"
              placeholder="ubuntu"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.username?.message}
              {...register('username')}
            />

            <Controller
              name="authType"
              control={control}
              render={({ field }) => (
                <Select
                  label="Auth Type"
                  options={authTypeOptions}
                  error={errors.authType?.message}
                  {...field}
                />
              )}
            />

            {/* Tags inline - spans 2 columns */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Tags ({tags.length}/{VALIDATION.TAG.MAX_TAGS})
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  leftIcon={<Tag className="w-4 h-4" />}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={tags.length >= VALIDATION.TAG.MAX_TAGS}
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-muted text-foreground rounded"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-status-error"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Credential - compact height */}
          <div>
            <Textarea
              label={authType === 'key' ? 'SSH Private Key' : 'Password'}
              placeholder={
                authType === 'key'
                  ? '-----BEGIN RSA PRIVATE KEY-----\n...'
                  : 'Enter your password'
              }
              error={errors.credential?.message}
              hint={isEdit ? 'Leave empty to keep existing credential' : undefined}
              rows={4}
              {...register('credential')}
            />
            <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-muted/50 border border-border/50">
              <ShieldCheck className="w-4 h-4 text-status-success flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Your credential will be encrypted with your account password.
                We can never see your credential in plaintext.
              </p>
            </div>
          </div>

          <CardFooter className="px-0 pb-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(ROUTES.INSTANCES)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isEdit ? 'Save Changes' : 'Create Instance'}
            </Button>
          </CardFooter>
        </form>
      </CardContent>

      {/* Password prompt for credential encryption */}
      <PasswordPrompt
        isOpen={showPasswordPrompt}
        onClose={() => {
          setShowPasswordPrompt(false);
          setPendingFormData(null);
          setPasswordError('');
        }}
        onSubmit={handlePasswordSubmit}
        title="Encrypt Credential"
        description="Enter your account password to securely encrypt your SSH key/password. This ensures only you can access your credentials."
        submitText="Encrypt & Save"
        isLoading={isLoading}
        error={passwordError}
      />
    </Card>
  );
}
