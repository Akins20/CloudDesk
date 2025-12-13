'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Server, Filter, X } from 'lucide-react';
import { Button, Input, Select, EmptyState, PageLoader } from '@/components/ui';
import { InstanceCard } from './InstanceCard';
import { ConnectModal } from './ConnectModal';
import { useInstanceStore } from '@/lib/stores';
import { ROUTES, CLOUD_PROVIDERS, PAGINATION } from '@/lib/utils/constants';
import { debounce } from '@/lib/utils/helpers';
import type { CloudProvider, InstanceStatus, DesktopEnvironment } from '@/lib/types';

export function InstanceList() {
  const router = useRouter();
  const {
    instances,
    isLoading,
    pagination,
    filters,
    fetchInstances,
    setFilters,
    clearFilters,
  } = useInstanceStore();

  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const [connectModal, setConnectModal] = useState<{
    isOpen: boolean;
    instanceId: string | null;
    desktopEnvironment: DesktopEnvironment;
  }>({
    isOpen: false,
    instanceId: null,
    desktopEnvironment: 'xfce',
  });

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const handleSearch = debounce((value: string) => {
    setFilters({ search: value || undefined, page: 1 });
    fetchInstances({ search: value || undefined, page: 1 });
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    handleSearch(value);
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as CloudProvider | '';
    setFilters({ provider: value || undefined, page: 1 });
    fetchInstances({ provider: value || undefined, page: 1 });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as InstanceStatus | '';
    setFilters({ status: value || undefined, page: 1 });
    fetchInstances({ status: value || undefined, page: 1 });
  };

  const handleClearFilters = () => {
    setSearchValue('');
    clearFilters();
    fetchInstances({ page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ page });
    fetchInstances({ page });
  };

  const handleConnect = (instanceId: string, desktopEnvironment: DesktopEnvironment) => {
    setConnectModal({
      isOpen: true,
      instanceId,
      desktopEnvironment,
    });
  };

  const hasActiveFilters = filters.search || filters.provider || filters.status;

  const providerOptions = [
    { value: '', label: 'All Providers' },
    ...Object.entries(CLOUD_PROVIDERS).map(([value, info]) => ({
      value,
      label: info.label,
    })),
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  if (isLoading && instances && instances.length === 0) {
    return <PageLoader message="Loading instances..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search instances..."
              leftIcon={<Search className="w-4 h-4" />}
              value={searchValue}
              onChange={handleSearchChange}
            />
          </div>
          <Button
            variant="outline"
            leftIcon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-foreground text-background rounded-full">
                !
              </span>
            )}
          </Button>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => router.push(ROUTES.INSTANCE_NEW)}
        >
          Add Instance
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-card border border-border rounded-lg">
          <div className="w-48">
            <Select
              options={providerOptions}
              value={filters.provider || ''}
              onChange={handleProviderChange}
            />
          </div>
          <div className="w-48">
            <Select
              options={statusOptions}
              value={filters.status || ''}
              onChange={handleStatusChange}
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<X className="w-4 h-4" />}
              onClick={handleClearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {instances && instances.length === 0 ? (
        <EmptyState
          icon={<Server className="w-8 h-8" />}
          title="No instances found"
          description={
            hasActiveFilters
              ? 'Try adjusting your filters or search query.'
              : "You haven't added any cloud instances yet. Add your first instance to get started."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => router.push(ROUTES.INSTANCE_NEW)}>
                Add your first instance
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {instances && instances.map((instance) => (
              <InstanceCard
                key={instance.id}
                instance={instance}
                onConnect={handleConnect}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <ConnectModal
        isOpen={connectModal.isOpen}
        instanceId={connectModal.instanceId}
        initialDesktopEnvironment={connectModal.desktopEnvironment}
        onClose={() => setConnectModal({ isOpen: false, instanceId: null, desktopEnvironment: 'xfce' })}
      />
    </div>
  );
}
