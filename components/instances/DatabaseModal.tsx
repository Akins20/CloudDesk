'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Table,
  Play,
  Lock,
  Loader2,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Server,
  AlertCircle,
} from 'lucide-react';
import { Modal, Button, Input } from '@/components/ui';
import { instanceService } from '@/lib/services/instance.service';
import { toast } from '@/lib/stores';
import { cn } from '@/lib/utils/helpers';
import type { DatabaseInfo, DatabaseConnection, QueryResult, DatabaseType } from '@/lib/types';

interface DatabaseModalProps {
  isOpen: boolean;
  instanceId: string | null;
  instanceName?: string;
  onClose: () => void;
}

const DATABASE_ICONS: Record<DatabaseType, { color: string; icon: string }> = {
  mysql: { color: 'text-blue-500', icon: 'MySQL' },
  postgresql: { color: 'text-blue-400', icon: 'PostgreSQL' },
  mongodb: { color: 'text-green-500', icon: 'MongoDB' },
  sqlite: { color: 'text-gray-400', icon: 'SQLite' },
  redis: { color: 'text-red-500', icon: 'Redis' },
};

const DEFAULT_PORTS: Record<DatabaseType, number> = {
  mysql: 3306,
  postgresql: 5432,
  mongodb: 27017,
  sqlite: 0,
  redis: 6379,
};

export function DatabaseModal({
  isOpen,
  instanceId,
  instanceName,
  onClose,
}: DatabaseModalProps) {
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  const [availableDatabases, setAvailableDatabases] = useState<DatabaseInfo[]>([]);
  const [selectedDb, setSelectedDb] = useState<DatabaseType | null>(null);
  const [databases, setDatabases] = useState<string[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [tables, setTables] = useState<string[]>([]);
  const [expandedDb, setExpandedDb] = useState<string | null>(null);

  // Connection form
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState<number>(3306);
  const [dbUsername, setDbUsername] = useState('');
  const [dbPassword, setDbPassword] = useState('');

  // Query execution
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setPasswordError('');
      setIsAuthenticated(false);
      setAvailableDatabases([]);
      setSelectedDb(null);
      setDatabases([]);
      setSelectedDatabase('');
      setTables([]);
      setQuery('');
      setQueryResult(null);
      setDbHost('localhost');
      setDbPort(3306);
      setDbUsername('');
      setDbPassword('');
    }
  }, [isOpen]);

  const detectDatabases = useCallback(async () => {
    if (!instanceId) return;

    setIsDetecting(true);
    try {
      const detected = await instanceService.detectDatabases(instanceId, password);
      setAvailableDatabases(detected);

      const available = detected.filter(d => d.isAvailable);
      if (available.length === 0) {
        toast.info('No database clients found on this instance');
      } else {
        toast.success(`Found ${available.length} database client(s)`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to detect databases';
      toast.error(message);
    } finally {
      setIsDetecting(false);
    }
  }, [instanceId, password]);

  const handleAuthenticate = async () => {
    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    setIsLoading(true);
    setPasswordError('');
    try {
      await detectDatabases();
      setIsAuthenticated(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      if (message.toLowerCase().includes('decrypt') || message.toLowerCase().includes('password')) {
        setPasswordError('Incorrect password. Please try again.');
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getConnection = useCallback((): DatabaseConnection => ({
    type: selectedDb!,
    host: dbHost,
    port: dbPort,
    database: selectedDatabase || undefined,
    username: dbUsername || undefined,
    password: dbPassword || undefined,
  }), [selectedDb, dbHost, dbPort, selectedDatabase, dbUsername, dbPassword]);

  const loadDatabases = async () => {
    if (!instanceId || !selectedDb) return;

    setIsLoading(true);
    try {
      const dbs = await instanceService.listDatabases(instanceId, password, getConnection());
      setDatabases(dbs);
      if (dbs.length > 0) {
        toast.success(`Found ${dbs.length} database(s)`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list databases';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTables = async (database: string) => {
    if (!instanceId || !selectedDb) return;

    setIsLoading(true);
    setSelectedDatabase(database);
    try {
      const conn = { ...getConnection(), database };
      const tbs = await instanceService.listTables(instanceId, password, conn);
      setTables(tbs);
      setExpandedDb(database);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list tables';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const executeQuery = async () => {
    if (!instanceId || !selectedDb || !query.trim()) return;

    setIsExecuting(true);
    setQueryResult(null);
    try {
      const result = await instanceService.executeQuery(instanceId, password, getConnection(), query);
      setQueryResult(result);
      if (result.success) {
        toast.success(`Query executed in ${result.executionTime}ms`);
      } else {
        toast.error(result.error || 'Query failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to execute query';
      toast.error(message);
      setQueryResult({ success: false, error: message });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSelectTable = (table: string) => {
    if (selectedDb === 'mongodb') {
      setQuery(`db.${table}.find().limit(10)`);
    } else if (selectedDb === 'redis') {
      setQuery(`GET ${table}`);
    } else {
      setQuery(`SELECT * FROM ${table} LIMIT 10;`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Database Manager"
      size="xl"
    >
      {!isAuthenticated ? (
        <>
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg mb-6">
            <Database className="w-8 h-8 text-foreground" />
            <div>
              <p className="font-medium text-foreground">
                {instanceName ? `Database Manager for ${instanceName}` : 'Database Manager'}
              </p>
              <p className="text-sm text-muted-foreground">
                Connect to MySQL, PostgreSQL, MongoDB, SQLite, or Redis databases
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              type="password"
              label="Account Password"
              placeholder="Enter your account password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
              }}
              leftIcon={<Lock className="w-4 h-4" />}
              error={passwordError}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAuthenticate} disabled={!password || isLoading} isLoading={isLoading}>
              Connect
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4 min-h-[500px]">
          {/* Database Selection */}
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground mr-2">Available:</span>
            {availableDatabases.map((db) => (
              <button
                key={db.type}
                onClick={() => {
                  if (db.isAvailable) {
                    setSelectedDb(db.type);
                    setDbPort(DEFAULT_PORTS[db.type]);
                    setDatabases([]);
                    setTables([]);
                    setSelectedDatabase('');
                    setQueryResult(null);
                  }
                }}
                disabled={!db.isAvailable}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  db.isAvailable
                    ? selectedDb === db.type
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted-foreground/10'
                    : 'opacity-50 cursor-not-allowed',
                  DATABASE_ICONS[db.type].color
                )}
              >
                {db.name}
                {db.version && <span className="ml-1 text-xs opacity-70">({db.version})</span>}
              </button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={detectDatabases}
              disabled={isDetecting}
              className="ml-auto"
            >
              <RefreshCw className={cn('w-4 h-4', isDetecting && 'animate-spin')} />
            </Button>
          </div>

          {selectedDb && (
            <div className="grid grid-cols-12 gap-4 flex-1">
              {/* Left Panel - Connection & Browser */}
              <div className="col-span-4 flex flex-col gap-4">
                {/* Connection Settings */}
                <div className="p-3 border border-border rounded-lg space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Connection
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Host"
                      value={dbHost}
                      onChange={(e) => setDbHost(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Port"
                      value={dbPort}
                      onChange={(e) => setDbPort(parseInt(e.target.value) || 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Username"
                      value={dbUsername}
                      onChange={(e) => setDbUsername(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={dbPassword}
                      onChange={(e) => setDbPassword(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={loadDatabases}
                    disabled={isLoading}
                    isLoading={isLoading}
                  >
                    Connect to {DATABASE_ICONS[selectedDb].icon}
                  </Button>
                </div>

                {/* Database Browser */}
                <div className="flex-1 border border-border rounded-lg overflow-hidden">
                  <div className="p-2 bg-muted text-xs font-medium">
                    Database Browser
                  </div>
                  <div className="p-2 max-h-60 overflow-y-auto">
                    {databases.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        Connect to list databases
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {databases.map((db) => (
                          <div key={db}>
                            <button
                              className="flex items-center gap-1 w-full text-left text-sm hover:bg-muted px-2 py-1 rounded"
                              onClick={() => loadTables(db)}
                            >
                              {expandedDb === db ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                              <Database className="w-3 h-3" />
                              {db}
                            </button>
                            {expandedDb === db && tables.length > 0 && (
                              <div className="ml-4 space-y-0.5">
                                {tables.map((table) => (
                                  <button
                                    key={table}
                                    className="flex items-center gap-1 w-full text-left text-xs hover:bg-muted px-2 py-1 rounded text-muted-foreground"
                                    onClick={() => handleSelectTable(table)}
                                  >
                                    <Table className="w-3 h-3" />
                                    {table}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel - Query & Results */}
              <div className="col-span-8 flex flex-col gap-4">
                {/* Query Editor */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-2 bg-muted">
                    <span className="text-xs font-medium">Query Editor</span>
                    <Button
                      size="sm"
                      onClick={executeQuery}
                      disabled={!query.trim() || isExecuting}
                      isLoading={isExecuting}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Execute
                    </Button>
                  </div>
                  <textarea
                    className="w-full h-32 p-3 bg-background text-sm font-mono resize-none focus:outline-none"
                    placeholder={selectedDb === 'mongodb'
                      ? "db.collection.find().limit(10)"
                      : selectedDb === 'redis'
                      ? "GET key_name"
                      : "SELECT * FROM table_name LIMIT 10;"}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        executeQuery();
                      }
                    }}
                  />
                </div>

                {/* Results */}
                <div className="flex-1 border border-border rounded-lg overflow-hidden">
                  <div className="p-2 bg-muted text-xs font-medium flex items-center justify-between">
                    <span>Results</span>
                    {queryResult && (
                      <span className="text-muted-foreground">
                        {queryResult.rowCount !== undefined && `${queryResult.rowCount} rows`}
                        {queryResult.executionTime && ` • ${queryResult.executionTime}ms`}
                      </span>
                    )}
                  </div>
                  <div className="p-2 max-h-48 overflow-auto">
                    {!queryResult ? (
                      <div className="text-center text-sm text-muted-foreground py-8">
                        Execute a query to see results
                      </div>
                    ) : !queryResult.success ? (
                      <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {queryResult.error}
                      </div>
                    ) : queryResult.data && queryResult.data.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              {Object.keys(queryResult.data[0]).map((col) => (
                                <th key={col} className="text-left p-2 font-medium">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {queryResult.data.map((row, i) => (
                              <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                                {Object.values(row).map((val, j) => (
                                  <td key={j} className="p-2 truncate max-w-48">
                                    {val === null ? (
                                      <span className="text-muted-foreground italic">NULL</span>
                                    ) : typeof val === 'object' ? (
                                      JSON.stringify(val)
                                    ) : (
                                      String(val)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        Query executed successfully (no rows returned)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
