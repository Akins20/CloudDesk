import { Client } from 'ssh2';
import { sshService } from './sshService';
import { logger } from '../utils/logger';

export interface ClipboardContent {
  text: string;
  timestamp: Date;
  source: 'local' | 'remote';
}

export interface ClipboardSyncResult {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Clipboard sync service for VNC sessions
 *
 * This service handles clipboard synchronization between the local browser
 * and the remote VNC session using X11 clipboard tools.
 *
 * X11 has multiple clipboard selections:
 * - PRIMARY: Selected text (middle-click paste)
 * - CLIPBOARD: Explicit copy/paste (Ctrl+C/Ctrl+V)
 * - SECONDARY: Rarely used
 *
 * We sync both PRIMARY and CLIPBOARD for full compatibility.
 */
class ClipboardService {
  /**
   * Check if clipboard tools are available on remote
   */
  async checkClipboardTools(client: Client): Promise<{
    xclipAvailable: boolean;
    xselAvailable: boolean;
    xdotoolAvailable: boolean;
  }> {
    const [xclip, xsel, xdotool] = await Promise.all([
      sshService.executeCommand(client, 'which xclip >/dev/null 2>&1 && echo "yes" || echo "no"'),
      sshService.executeCommand(client, 'which xsel >/dev/null 2>&1 && echo "yes" || echo "no"'),
      sshService.executeCommand(client, 'which xdotool >/dev/null 2>&1 && echo "yes" || echo "no"'),
    ]);

    return {
      xclipAvailable: xclip.stdout.trim() === 'yes',
      xselAvailable: xsel.stdout.trim() === 'yes',
      xdotoolAvailable: xdotool.stdout.trim() === 'yes',
    };
  }

  /**
   * Install clipboard tools on remote
   */
  async installClipboardTools(client: Client, packageManager: string): Promise<boolean> {
    try {
      const packages = ['xclip', 'xsel', 'xdotool'];
      let installCmd: string;

      switch (packageManager) {
        case 'apt':
          installCmd = `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${packages.join(' ')}`;
          break;
        case 'dnf':
          installCmd = `sudo dnf install -y ${packages.join(' ')}`;
          break;
        case 'yum':
          installCmd = `sudo yum install -y ${packages.join(' ')}`;
          break;
        case 'pacman':
          installCmd = `sudo pacman -S --noconfirm ${packages.join(' ')}`;
          break;
        case 'apk':
          installCmd = `sudo apk add ${packages.join(' ')}`;
          break;
        case 'zypper':
          installCmd = `sudo zypper install -y ${packages.join(' ')}`;
          break;
        default:
          logger.warn(`Unknown package manager: ${packageManager}`);
          return false;
      }

      const result = await sshService.executeCommand(client, installCmd, { timeout: 120000 });
      return result.code === 0;
    } catch (error) {
      logger.error('Failed to install clipboard tools:', error);
      return false;
    }
  }

  /**
   * Get clipboard content from remote VNC session
   *
   * @param client - SSH client
   * @param displayNumber - VNC display number (e.g., 1 for :1)
   * @param selection - Which clipboard to read ('clipboard' or 'primary')
   */
  async getRemoteClipboard(
    client: Client,
    displayNumber: number,
    selection: 'clipboard' | 'primary' = 'clipboard'
  ): Promise<ClipboardSyncResult> {
    try {
      // Set DISPLAY environment variable for the VNC session
      const display = `:${displayNumber}`;
      const selectionFlag = selection === 'clipboard' ? '-selection clipboard' : '-selection primary';

      // Try xclip first, fall back to xsel
      let result = await sshService.executeCommand(
        client,
        `DISPLAY=${display} xclip ${selectionFlag} -o 2>/dev/null`,
        { timeout: 5000 }
      );

      if (result.code !== 0) {
        // Try xsel as fallback
        const xselFlag = selection === 'clipboard' ? '--clipboard' : '--primary';
        result = await sshService.executeCommand(
          client,
          `DISPLAY=${display} xsel ${xselFlag} --output 2>/dev/null`,
          { timeout: 5000 }
        );
      }

      if (result.code === 0) {
        return {
          success: true,
          content: result.stdout,
        };
      }

      return {
        success: false,
        error: 'Failed to read clipboard',
      };
    } catch (error) {
      logger.error('Error getting remote clipboard:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Set clipboard content on remote VNC session
   *
   * @param client - SSH client
   * @param displayNumber - VNC display number
   * @param content - Text content to set
   * @param selection - Which clipboard to set ('clipboard', 'primary', or 'both')
   */
  async setRemoteClipboard(
    client: Client,
    displayNumber: number,
    content: string,
    selection: 'clipboard' | 'primary' | 'both' = 'both'
  ): Promise<ClipboardSyncResult> {
    try {
      const display = `:${displayNumber}`;

      // Escape content for shell (use base64 to avoid escaping issues)
      const base64Content = Buffer.from(content).toString('base64');

      const setClipboard = async (sel: 'clipboard' | 'primary'): Promise<boolean> => {
        const selectionFlag = sel === 'clipboard' ? '-selection clipboard' : '-selection primary';

        // Try xclip first
        let result = await sshService.executeCommand(
          client,
          `echo "${base64Content}" | base64 -d | DISPLAY=${display} xclip ${selectionFlag} -i 2>/dev/null`,
          { timeout: 5000 }
        );

        if (result.code !== 0) {
          // Try xsel as fallback
          const xselFlag = sel === 'clipboard' ? '--clipboard' : '--primary';
          result = await sshService.executeCommand(
            client,
            `echo "${base64Content}" | base64 -d | DISPLAY=${display} xsel ${xselFlag} --input 2>/dev/null`,
            { timeout: 5000 }
          );
        }

        return result.code === 0;
      };

      let success = true;

      if (selection === 'both' || selection === 'clipboard') {
        success = success && await setClipboard('clipboard');
      }

      if (selection === 'both' || selection === 'primary') {
        success = success && await setClipboard('primary');
      }

      if (success) {
        return { success: true };
      }

      return {
        success: false,
        error: 'Failed to set clipboard',
      };
    } catch (error) {
      logger.error('Error setting remote clipboard:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync clipboard from local to remote
   * Call this when user copies text in browser
   */
  async syncLocalToRemote(
    client: Client,
    displayNumber: number,
    localContent: string
  ): Promise<ClipboardSyncResult> {
    return this.setRemoteClipboard(client, displayNumber, localContent, 'both');
  }

  /**
   * Sync clipboard from remote to local
   * Call this periodically or on demand
   */
  async syncRemoteToLocal(
    client: Client,
    displayNumber: number
  ): Promise<ClipboardSyncResult> {
    // Get both selections and return whichever has content
    const [clipboard, primary] = await Promise.all([
      this.getRemoteClipboard(client, displayNumber, 'clipboard'),
      this.getRemoteClipboard(client, displayNumber, 'primary'),
    ]);

    // Prefer CLIPBOARD over PRIMARY
    if (clipboard.success && clipboard.content) {
      return clipboard;
    }
    if (primary.success && primary.content) {
      return primary;
    }

    return {
      success: true,
      content: '',
    };
  }

  /**
   * Clear remote clipboard
   */
  async clearRemoteClipboard(
    client: Client,
    displayNumber: number
  ): Promise<ClipboardSyncResult> {
    return this.setRemoteClipboard(client, displayNumber, '', 'both');
  }

  /**
   * Get clipboard history (if supported)
   * Note: This requires additional tools like clipman or gpaste
   */
  async getClipboardHistory(
    client: Client,
    displayNumber: number,
    limit: number = 10
  ): Promise<{ success: boolean; history: string[]; error?: string }> {
    try {
      const display = `:${displayNumber}`;

      // Try clipman first (common on XFCE)
      let result = await sshService.executeCommand(
        client,
        `DISPLAY=${display} clipman history --limit ${limit} 2>/dev/null`,
        { timeout: 5000 }
      );

      if (result.code === 0 && result.stdout.trim()) {
        const history = result.stdout.trim().split('\n');
        return { success: true, history };
      }

      // Clipboard history not available
      return {
        success: false,
        history: [],
        error: 'Clipboard history not available. Install clipman or gpaste for history support.',
      };
    } catch (error) {
      return {
        success: false,
        history: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const clipboardService = new ClipboardService();
export default clipboardService;
