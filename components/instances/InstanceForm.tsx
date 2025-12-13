'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Server, Globe, User, Key, Lock, Tag, X } from 'lucide-react';
import { Button, Input, Select, Textarea, Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui';
import { useInstanceStore, toast } from '@/lib/stores';
import { createInstanceSchema, updateInstanceSchema, type CreateInstanceFormData, type UpdateInstanceFormData } from '@/lib/utils/validators';
import { ROUTES, SUCCESS_MESSAGES, CLOUD_PROVIDERS, AUTH_TYPES, VALIDATION } from '@/lib/utils/constants';
import type { Instance, CloudProvider, AuthType } from '@/lib/types';

interface InstanceFormProps {
  instance?: Instance;
  mode: 'create' | 'edit';
}

export function InstanceForm({ instance, mode }: InstanceFormProps) {
  const router = useRouter();
  const { createInstance, updateInstance, isCreating, isUpdating } = useInstanceStore();
  const [tagInput, setTagInput] = useState('');

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Host"
                placeholder="192.168.1.1 or hostname.com"
                leftIcon={<Globe className="w-4 h-4" />}
                error={errors.host?.message}
                {...register('host')}
              />
            </div>

            <Input
              label="SSH Port"
              type="number"
              placeholder="22"
              error={errors.port?.message}
              {...register('port', { valueAsNumber: true })}
            />
          </div>

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
                label="Authentication Type"
                options={authTypeOptions}
                error={errors.authType?.message}
                {...field}
              />
            )}
          />

          <Textarea
            label={authType === 'key' ? 'SSH Private Key' : 'Password'}
            placeholder={
              authType === 'key'
                ? '-----BEGIN RSA PRIVATE KEY-----\n...'
                : 'Enter your password'
            }
            error={errors.credential?.message}
            hint={isEdit ? 'Leave empty to keep existing credential' : undefined}
            {...register('credential')}
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add a tag"
                leftIcon={<Tag className="w-4 h-4" />}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
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
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-muted text-foreground rounded-md"
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
            <p className="mt-1.5 text-sm text-muted-foreground">
              {tags.length}/{VALIDATION.TAG.MAX_TAGS} tags
            </p>
          </div>

          <CardFooter className="px-0 pb-0">
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
    </Card>
  );
}
