'use client';

import { useState, useEffect } from 'react';
import {
  Folder,
  File,
  ChevronRight,
  Home,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  FolderPlus,
  Lock,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { Modal, Button, Input } from '@/components/ui';
import { instanceService } from '@/lib/services/instance.service';
import { toast } from '@/lib/stores';
import { cn } from '@/lib/utils/helpers';
import type { DirectoryListing, FileInfo } from '@/lib/types';

interface FileBrowserModalProps {
  isOpen: boolean;
  instanceId: string | null;
  instanceName?: string;
  onClose: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function FileBrowserModal({
  isOpen,
  instanceId,
  instanceName,
  onClose,
}: FileBrowserModalProps) {
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPath, setCurrentPath] = useState('~');
  const [listing, setListing] = useState<DirectoryListing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [pathHistory, setPathHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setPasswordError('');
      setIsAuthenticated(false);
      setCurrentPath('~');
      setListing(null);
      setSelectedFiles(new Set());
      setPathHistory([]);
    }
  }, [isOpen]);

  const loadDirectory = async (path: string) => {
    if (!instanceId) return;

    setIsLoading(true);
    try {
      const data = await instanceService.listDirectory(instanceId, password, path);
      setListing(data);
      setCurrentPath(data.path);
      setSelectedFiles(new Set());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load directory';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    setIsLoading(true);
    setPasswordError('');
    try {
      await loadDirectory('~');
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

  const handleNavigate = (path: string) => {
    setPathHistory([...pathHistory, currentPath]);
    loadDirectory(path);
  };

  const handleGoBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(pathHistory.slice(0, -1));
      loadDirectory(previousPath);
    }
  };

  const handleGoHome = () => {
    setPathHistory([...pathHistory, currentPath]);
    loadDirectory('~');
  };

  const handleGoUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    setPathHistory([...pathHistory, currentPath]);
    loadDirectory(parentPath);
  };

  const handleFileClick = (file: FileInfo) => {
    if (file.isDirectory) {
      handleNavigate(file.path);
    } else {
      // Toggle selection
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.path)) {
        newSelected.delete(file.path);
      } else {
        newSelected.add(file.path);
      }
      setSelectedFiles(newSelected);
    }
  };

  const handleDownload = async (file: FileInfo) => {
    if (!instanceId) return;

    try {
      const blob = await instanceService.downloadFile(instanceId, password, file.path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${file.filename}`);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (file: FileInfo) => {
    if (!instanceId) return;

    if (!confirm(`Delete ${file.filename}?`)) return;

    try {
      await instanceService.deleteFile(instanceId, password, file.path, file.isDirectory);
      toast.success(`Deleted ${file.filename}`);
      loadDirectory(currentPath);
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleCreateFolder = async () => {
    if (!instanceId || !newFolderName) return;

    const folderPath = `${currentPath}/${newFolderName}`.replace(/\/+/g, '/');
    try {
      await instanceService.createDirectory(instanceId, password, folderPath);
      toast.success(`Created folder ${newFolderName}`);
      setNewFolderName('');
      setIsCreatingFolder(false);
      loadDirectory(currentPath);
    } catch (error) {
      toast.error('Failed to create folder');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!instanceId || !e.target.files) return;

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const remotePath = `${currentPath}/${file.name}`.replace(/\/+/g, '/');
      try {
        await instanceService.uploadFile(instanceId, password, remotePath, base64);
        toast.success(`Uploaded ${file.name}`);
        loadDirectory(currentPath);
      } catch (error) {
        toast.error('Failed to upload file');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="File Browser"
      size="xl"
    >
      {!isAuthenticated ? (
        <>
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg mb-6">
            <Folder className="w-8 h-8 text-foreground" />
            <div>
              <p className="font-medium text-foreground">
                {instanceName ? `Browse ${instanceName}` : 'SFTP File Browser'}
              </p>
              <p className="text-sm text-muted-foreground">
                Upload, download, and manage files on your instance
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
              Open Browser
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleGoBack}
              disabled={pathHistory.length === 0 || isLoading}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleGoUp} disabled={isLoading}>
              <ChevronRight className="w-4 h-4 rotate-90" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleGoHome} disabled={isLoading}>
              <Home className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => loadDirectory(currentPath)}
              disabled={isLoading}
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </Button>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsCreatingFolder(true)}
              disabled={isLoading}
            >
              <FolderPlus className="w-4 h-4" />
            </Button>
            <label className="cursor-pointer">
              <input type="file" className="hidden" onChange={handleUpload} disabled={isLoading} />
              <span className={cn(
                'inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors',
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'
              )}>
                <Upload className="w-4 h-4" />
              </span>
            </label>
          </div>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-sm mb-4 p-2 bg-muted rounded-lg overflow-x-auto">
            <button
              className="text-muted-foreground hover:text-foreground"
              onClick={handleGoHome}
            >
              ~
            </button>
            {breadcrumbs.map((part, i) => (
              <span key={i} className="flex items-center">
                <ChevronRight className="w-3 h-3 text-muted-foreground mx-1" />
                <button
                  className="text-muted-foreground hover:text-foreground truncate max-w-32"
                  onClick={() => {
                    const path = '/' + breadcrumbs.slice(0, i + 1).join('/');
                    handleNavigate(path);
                  }}
                >
                  {part}
                </button>
              </span>
            ))}
          </div>

          {/* New Folder Input */}
          {isCreatingFolder && (
            <div className="flex items-center gap-2 mb-4 p-2 bg-muted rounded-lg">
              <FolderPlus className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                className="flex-1 bg-transparent border-none outline-none text-sm"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }
                }}
                autoFocus
              />
              <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName}>
                Create
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* File List */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-2 p-2 bg-muted text-xs text-muted-foreground font-medium">
              <div className="col-span-6">Name</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Modified</div>
              <div className="col-span-2">Actions</div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : listing && listing.files.length > 0 ? (
                listing.files.map((file) => (
                  <div
                    key={file.path}
                    className={cn(
                      'grid grid-cols-12 gap-2 p-2 text-sm hover:bg-muted/50 cursor-pointer',
                      selectedFiles.has(file.path) && 'bg-primary/10'
                    )}
                    onClick={() => handleFileClick(file)}
                  >
                    <div className="col-span-6 flex items-center gap-2 truncate">
                      {file.isDirectory ? (
                        <Folder className="w-4 h-4 text-status-warning flex-shrink-0" />
                      ) : (
                        <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="truncate">{file.filename}</span>
                    </div>
                    <div className="col-span-2 text-muted-foreground">
                      {file.isDirectory ? '-' : formatFileSize(file.size)}
                    </div>
                    <div className="col-span-2 text-muted-foreground text-xs">
                      {formatDate(file.modifyTime)}
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      {!file.isDirectory && (
                        <button
                          className="p-1 hover:bg-muted rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(file);
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        className="p-1 hover:bg-muted rounded text-status-error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Empty directory
                </div>
              )}
            </div>
          </div>

          {/* Footer Stats */}
          {listing && (
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <span>
                {listing.directoryCount} folders, {listing.fileCount} files
              </span>
              <span>Total: {formatFileSize(listing.totalSize)}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
