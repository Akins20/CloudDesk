'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Server } from 'lucide-react';
import { Instance } from '@/lib/types';
import { InstanceListItem } from './InstanceListItem';
import { Input } from '@/components/ui';

interface InstanceListPanelProps {
  instances: Instance[];
  onRefresh?: () => void;
}

type SortOption = 'name' | 'status' | 'lastConnected' | 'provider';
type FilterOption = 'all' | 'active' | 'inactive';

export function InstanceListPanel({ instances, onRefresh }: InstanceListPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('lastConnected');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const filteredAndSortedInstances = useMemo(() => {
    let result = [...instances];

    // Filter
    if (filterBy !== 'all') {
      result = result.filter((instance) => instance.status === filterBy);
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (instance) =>
          instance.name.toLowerCase().includes(query) ||
          instance.host.toLowerCase().includes(query) ||
          instance.provider.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'provider':
          return a.provider.localeCompare(b.provider);
        case 'lastConnected':
        default:
          const dateA = a.lastConnectedAt ? new Date(a.lastConnectedAt).getTime() : 0;
          const dateB = b.lastConnectedAt ? new Date(b.lastConnectedAt).getTime() : 0;
          return dateB - dateA;
      }
    });

    return result;
  }, [instances, searchQuery, sortBy, filterBy]);

  const activeCount = instances.filter((i) => i.status === 'active').length;

  return (
    <div className="flex flex-col h-full rounded-xl bg-card/50 border border-border/50 animate-panel-breathe overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-foreground" />
            <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">
              Instances
            </h2>
            <span className="text-xs text-muted-foreground">
              ({activeCount} active / {instances.length} total)
            </span>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search instances..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-muted/30"
            />
          </div>

          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="h-9 px-3 rounded-md bg-muted/30 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-9 px-3 rounded-md bg-muted/30 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="lastConnected">Recent</option>
            <option value="name">Name</option>
            <option value="status">Status</option>
            <option value="provider">Provider</option>
          </select>
        </div>
      </div>

      {/* Instance list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredAndSortedInstances.length > 0 ? (
          filteredAndSortedInstances.map((instance) => (
            <InstanceListItem
              key={instance.id}
              instance={instance}
              onDelete={onRefresh}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Server className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {searchQuery || filterBy !== 'all'
                ? 'No instances match your filters'
                : 'No instances yet'}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {searchQuery || filterBy !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add your first instance to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
