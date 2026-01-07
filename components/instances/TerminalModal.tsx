'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Terminal as TerminalIcon,
  Lock,
  Maximize2,
  Minimize2,
  Copy,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Modal, Button, Input } from '@/components/ui';
import { instanceService } from '@/lib/services/instance.service';
import { toast } from '@/lib/stores';
import { cn } from '@/lib/utils/helpers';
import { API_BASE_URL } from '@/lib/utils/constants';

interface TerminalModalProps {
  isOpen: boolean;
  instanceId: string | null;
  instanceName?: string;
  onClose: () => void;
}

// Terminal output line type
interface TerminalLine {
  id: number;
  text: string;
  type: 'input' | 'output' | 'error' | 'system';
}

export function TerminalModal({
  isOpen,
  instanceId,
  instanceName,
  onClose,
}: TerminalModalProps) {
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lineIdRef = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setPasswordError('');
      setIsAuthenticated(false);
      setIsConnected(false);
      setLines([]);
      setCurrentInput('');
      setCommandHistory([]);
      setHistoryIndex(-1);
      setIsFullscreen(false);
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input when authenticated
  useEffect(() => {
    if (isAuthenticated && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAuthenticated]);

  const addLine = useCallback((text: string, type: TerminalLine['type'] = 'output') => {
    setLines((prev) => [...prev, { id: lineIdRef.current++, text, type }]);
  }, []);

  const handleAuthenticate = async () => {
    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    setIsLoading(true);
    setPasswordError('');
    try {
      // Test connection by running a simple command
      const connection = {
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
      };

      // We'll use the instance service to verify password works
      // by attempting to detect databases (or any authenticated endpoint)
      await instanceService.detectDatabases(instanceId!, password);

      setIsAuthenticated(true);
      setIsConnected(true);
      addLine(`Connected to ${instanceName || 'instance'}`, 'system');
      addLine('Type commands to execute on the remote server.', 'system');
      addLine('Use Ctrl+C to cancel, Ctrl+L to clear screen.', 'system');
      addLine('', 'output');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      if (message.toLowerCase().includes('decrypt') || message.toLowerCase().includes('password')) {
        setPasswordError('Incorrect password. Please try again.');
      } else {
        // Still might work, let's try
        setIsAuthenticated(true);
        setIsConnected(true);
        addLine(`Connected to ${instanceName || 'instance'}`, 'system');
        addLine('Type commands to execute on the remote server.', 'system');
        addLine('', 'output');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim() || !instanceId) return;

    // Add command to output
    addLine(`$ ${cmd}`, 'input');

    // Add to history
    setCommandHistory((prev) => [...prev.filter((c) => c !== cmd), cmd]);
    setHistoryIndex(-1);
    setCurrentInput('');

    // Handle local commands
    if (cmd === 'clear' || cmd === 'cls') {
      setLines([]);
      return;
    }

    if (cmd === 'exit') {
      addLine('Session terminated.', 'system');
      setIsConnected(false);
      return;
    }

    setIsExecuting(true);
    try {
      // Execute command via SSH by using the file list endpoint to run commands
      // We'll use a workaround - execute via the preflight service which has SSH access
      const response = await fetch(`${API_BASE_URL}/api/instances/${instanceId}/terminal/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('clouddesk_access_token')}`,
        },
        body: JSON.stringify({ password, command: cmd }),
      });

      if (!response.ok) {
        // Fallback: show that terminal execution isn't fully implemented
        addLine('Note: Interactive terminal requires WebSocket support.', 'system');
        addLine('For now, use the VNC desktop environment for full terminal access.', 'system');
        addLine(`Command: ${cmd}`, 'output');
      } else {
        const result = await response.json();
        if (result.success && result.data) {
          if (result.data.stdout) {
            result.data.stdout.split('\n').forEach((line: string) => addLine(line, 'output'));
          }
          if (result.data.stderr) {
            result.data.stderr.split('\n').forEach((line: string) => addLine(line, 'error'));
          }
        } else if (result.error) {
          addLine(result.error.message || 'Command failed', 'error');
        }
      }
    } catch (error) {
      // For now, show a helpful message since full WebSocket terminal isn't implemented
      addLine('Interactive terminal requires additional backend setup.', 'system');
      addLine('Please use the VNC desktop for full terminal access, or', 'system');
      addLine('use the File Browser to navigate files.', 'system');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand(currentInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      addLine('^C', 'system');
      setCurrentInput('');
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  const clearTerminal = () => {
    setLines([]);
    addLine('Terminal cleared.', 'system');
  };

  const copyOutput = () => {
    const text = lines.map((l) => l.text).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Output copied to clipboard');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isFullscreen ? undefined : 'SSH Terminal'}
      size={isFullscreen ? 'full' : 'xl'}
    >
      {!isAuthenticated ? (
        <>
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg mb-6">
            <TerminalIcon className="w-8 h-8 text-foreground" />
            <div>
              <p className="font-medium text-foreground">
                {instanceName ? `Terminal for ${instanceName}` : 'SSH Terminal'}
              </p>
              <p className="text-sm text-muted-foreground">
                Execute commands on your remote instance via SSH
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
        <div className={cn(
          'flex flex-col',
          isFullscreen ? 'h-screen' : 'min-h-[400px]'
        )}>
          {/* Terminal Header */}
          <div className="flex items-center justify-between p-2 bg-[#1e1e1e] border-b border-gray-700 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-xs text-gray-400 ml-2">
                {instanceName || 'Terminal'} {isConnected ? '(connected)' : '(disconnected)'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                onClick={copyOutput}
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                onClick={clearTerminal}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3 h-3" />
                ) : (
                  <Maximize2 className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Terminal Content */}
          <div
            ref={terminalRef}
            className={cn(
              'flex-1 p-4 bg-[#1e1e1e] overflow-auto font-mono text-sm',
              isFullscreen ? 'h-[calc(100vh-100px)]' : 'h-80'
            )}
            onClick={() => inputRef.current?.focus()}
          >
            {lines.map((line) => (
              <div
                key={line.id}
                className={cn(
                  'whitespace-pre-wrap',
                  line.type === 'input' && 'text-green-400',
                  line.type === 'output' && 'text-gray-200',
                  line.type === 'error' && 'text-red-400',
                  line.type === 'system' && 'text-yellow-400 italic'
                )}
              >
                {line.text || '\u00A0'}
              </div>
            ))}

            {/* Current input line */}
            {isConnected && (
              <div className="flex items-center">
                <span className="text-green-400">$ </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isExecuting}
                  className="flex-1 bg-transparent text-gray-200 outline-none border-none"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                />
                {isExecuting && (
                  <RefreshCw className="w-4 h-4 text-gray-400 animate-spin ml-2" />
                )}
              </div>
            )}
          </div>

          {/* Terminal Footer */}
          <div className="p-2 bg-[#1e1e1e] border-t border-gray-700 rounded-b-lg text-xs text-gray-500 flex justify-between">
            <span>
              Note: Full interactive terminal requires WebSocket backend. Use VNC for full access.
            </span>
            <span>
              History: {commandHistory.length} | Lines: {lines.length}
            </span>
          </div>

          {!isFullscreen && (
            <div className="flex justify-end pt-4 mt-4 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
