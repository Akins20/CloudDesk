'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle,
  Download,
  Loader2,
  Lock,
  Code,
  Database,
  Cloud,
  Terminal,
  Wrench,
  Info,
} from 'lucide-react';
import { Modal, Button, Input, Badge } from '@/components/ui';
import { instanceService } from '@/lib/services/instance.service';
import { toast } from '@/lib/stores';
import { cn } from '@/lib/utils/helpers';
import type { SoftwareTemplate, InstallSoftwareResult } from '@/lib/types';

interface SoftwareTemplatesModalProps {
  isOpen: boolean;
  instanceId: string | null;
  instanceName?: string;
  onClose: () => void;
}

const TEMPLATE_ICONS: Record<string, typeof Code> = {
  nodejs: Code,
  python: Code,
  java: Code,
  rust: Code,
  go: Code,
  cpp: Code,
  dotnet: Code,
  php: Code,
  ruby: Code,
  docker: Cloud,
  kubernetes: Cloud,
  terraform: Cloud,
  aws: Cloud,
  devops: Wrench,
  webdev: Code,
  vscode: Terminal,
  git: Terminal,
  vim: Terminal,
  database: Database,
  monitoring: Wrench,
};

const TEMPLATE_CATEGORIES: Record<string, string[]> = {
  'Languages & Runtimes': ['nodejs', 'python', 'java', 'rust', 'go', 'cpp', 'dotnet', 'php', 'ruby'],
  'DevOps & Cloud': ['docker', 'kubernetes', 'terraform', 'aws', 'devops'],
  'Development Tools': ['vscode', 'git', 'vim', 'webdev'],
  'Data & Monitoring': ['database', 'monitoring'],
};

export function SoftwareTemplatesModal({
  isOpen,
  instanceId,
  instanceName,
  onClose,
}: SoftwareTemplatesModalProps) {
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templates, setTemplates] = useState<SoftwareTemplate[]>([]);
  const [installingTemplate, setInstallingTemplate] = useState<string | null>(null);
  const [installResult, setInstallResult] = useState<InstallSoftwareResult | null>(null);

  useEffect(() => {
    if (isOpen && instanceId) {
      loadTemplates();
    }
    if (!isOpen) {
      setPassword('');
      setPasswordError('');
      setInstallResult(null);
    }
  }, [isOpen, instanceId]);

  const loadTemplates = async () => {
    if (!instanceId) return;
    setIsLoadingTemplates(true);
    try {
      const data = await instanceService.getSoftwareTemplates(instanceId);
      setTemplates(data);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleInstall = async (templateId: string) => {
    if (!instanceId) return;

    if (!password) {
      setPasswordError('Password is required to install software');
      return;
    }

    setInstallingTemplate(templateId);
    setPasswordError('');
    setInstallResult(null);

    try {
      const result = await instanceService.installSoftware(instanceId, templateId, password);
      setInstallResult(result);
      if (result.success) {
        toast.success(`Successfully installed ${templateId}`);
        // Refresh templates to show installed status
        loadTemplates();
      } else {
        toast.error(`Installation had errors: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Installation failed';
      if (message.toLowerCase().includes('decrypt') || message.toLowerCase().includes('password')) {
        setPasswordError('Incorrect password. Please try again.');
      } else {
        toast.error(message);
      }
    } finally {
      setInstallingTemplate(null);
    }
  };

  const getTemplateIcon = (templateId: string) => {
    const Icon = TEMPLATE_ICONS[templateId] || Package;
    return <Icon className="w-5 h-5" />;
  };

  const getCategorizedTemplates = () => {
    const categorized: Record<string, SoftwareTemplate[]> = {};

    for (const [category, ids] of Object.entries(TEMPLATE_CATEGORIES)) {
      const categoryTemplates = templates.filter(t => ids.includes(t.templateId));
      if (categoryTemplates.length > 0) {
        categorized[category] = categoryTemplates;
      }
    }

    // Add uncategorized templates
    const categorizedIds = Object.values(TEMPLATE_CATEGORIES).flat();
    const uncategorized = templates.filter(t => !categorizedIds.includes(t.templateId));
    if (uncategorized.length > 0) {
      categorized['Other'] = uncategorized;
    }

    return categorized;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dev Software Templates"
      size="lg"
    >
      <div className="flex items-center gap-3 p-4 bg-muted rounded-lg mb-6">
        <Package className="w-8 h-8 text-foreground" />
        <div>
          <p className="font-medium text-foreground">
            {instanceName ? `Install on ${instanceName}` : 'Install Development Tools'}
          </p>
          <p className="text-sm text-muted-foreground">
            One-click installation of popular dev tools
          </p>
        </div>
      </div>

      {/* Password Input */}
      <div className="mb-6">
        <Input
          type="password"
          label="Account Password"
          placeholder="Enter your account password to install"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError('');
          }}
          leftIcon={<Lock className="w-4 h-4" />}
          error={passwordError}
        />
      </div>

      {/* Installation Result */}
      {installResult && (
        <div
          className={cn(
            'p-4 rounded-lg mb-6',
            installResult.success ? 'bg-status-success/10' : 'bg-status-error/10'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {installResult.success ? (
              <CheckCircle className="w-5 h-5 text-status-success" />
            ) : (
              <Info className="w-5 h-5 text-status-error" />
            )}
            <span className="font-medium">
              {installResult.success ? 'Installation Complete' : 'Installation Had Issues'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Installed {installResult.packagesInstalled.length} packages in{' '}
            {Math.round(installResult.duration / 1000)}s
          </p>
          {installResult.errors.length > 0 && (
            <ul className="mt-2 text-xs text-status-error">
              {installResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Templates List */}
      {isLoadingTemplates ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-6">
          {Object.entries(getCategorizedTemplates()).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">{category}</h4>
              <div className="grid grid-cols-1 gap-2">
                {categoryTemplates.map((template) => (
                  <div
                    key={template.templateId}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border transition-colors',
                      template.installed
                        ? 'bg-status-success/5 border-status-success/20'
                        : 'bg-muted/50 border-border hover:bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-lg',
                          template.installed ? 'bg-status-success/10' : 'bg-muted'
                        )}
                      >
                        {getTemplateIcon(template.templateId)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{template.name}</span>
                          {template.installed && (
                            <Badge variant="success" size="sm">
                              Installed
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={template.installed ? 'outline' : 'primary'}
                      onClick={() => handleInstall(template.templateId)}
                      disabled={!password || installingTemplate !== null}
                      isLoading={installingTemplate === template.templateId}
                    >
                      {template.installed ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Reinstall
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-1" />
                          Install
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
