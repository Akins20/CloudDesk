import { Client, SFTPWrapper } from 'ssh2';
import { Readable } from 'stream';

export interface FileInfo {
  filename: string;
  path: string;
  size: number;
  modifyTime: Date;
  accessTime: Date;
  isDirectory: boolean;
  isFile: boolean;
  isSymlink: boolean;
  permissions: string;
  owner: number;
  group: number;
}

export interface DirectoryListing {
  path: string;
  files: FileInfo[];
  totalSize: number;
  fileCount: number;
  directoryCount: number;
}

export interface TransferProgress {
  filename: string;
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export interface TransferResult {
  success: boolean;
  filename: string;
  remotePath: string;
  localPath?: string;
  size: number;
  duration: number;
  error?: string;
}

class SFTPService {
  /**
   * Get SFTP wrapper from SSH client
   */
  private getSFTP(client: Client): Promise<SFTPWrapper> {
    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) {
          reject(new Error(`Failed to create SFTP session: ${err.message}`));
        } else {
          resolve(sftp);
        }
      });
    });
  }

  /**
   * List directory contents
   */
  async listDirectory(client: Client, remotePath: string): Promise<DirectoryListing> {
    const sftp = await this.getSFTP(client);

    return new Promise((resolve, reject) => {
      sftp.readdir(remotePath, (err, list) => {
        if (err) {
          sftp.end();
          reject(new Error(`Failed to list directory: ${err.message}`));
          return;
        }

        const files: FileInfo[] = list.map((item) => {
          const attrs = item.attrs;
          const mode = attrs.mode || 0;

          return {
            filename: item.filename,
            path: `${remotePath}/${item.filename}`.replace(/\/+/g, '/'),
            size: attrs.size || 0,
            modifyTime: new Date((attrs.mtime || 0) * 1000),
            accessTime: new Date((attrs.atime || 0) * 1000),
            isDirectory: (mode & 0o40000) === 0o40000,
            isFile: (mode & 0o100000) === 0o100000,
            isSymlink: (mode & 0o120000) === 0o120000,
            permissions: this.formatPermissions(mode),
            owner: attrs.uid || 0,
            group: attrs.gid || 0,
          };
        });

        // Sort: directories first, then files alphabetically
        files.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.filename.localeCompare(b.filename);
        });

        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        const fileCount = files.filter((f) => f.isFile).length;
        const directoryCount = files.filter((f) => f.isDirectory).length;

        sftp.end();
        resolve({
          path: remotePath,
          files,
          totalSize,
          fileCount,
          directoryCount,
        });
      });
    });
  }

  /**
   * Download file from remote to buffer
   */
  async downloadFile(
    client: Client,
    remotePath: string,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<{ data: Buffer; size: number }> {
    const sftp = await this.getSFTP(client);

    // Get file stats first
    const stats = await this.getFileStats(sftp, remotePath);
    const totalBytes = stats.size || 0;

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let bytesTransferred = 0;

      const readStream = sftp.createReadStream(remotePath);

      readStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        bytesTransferred += chunk.length;

        if (onProgress && totalBytes > 0) {
          onProgress({
            filename: remotePath.split('/').pop() || '',
            bytesTransferred,
            totalBytes,
            percentage: Math.round((bytesTransferred / totalBytes) * 100),
          });
        }
      });

      readStream.on('end', () => {
        sftp.end();
        const data = Buffer.concat(chunks);
        resolve({ data, size: data.length });
      });

      readStream.on('error', (err: Error) => {
        sftp.end();
        reject(new Error(`Download failed: ${err.message}`));
      });
    });
  }

  /**
   * Upload file from buffer to remote
   */
  async uploadFile(
    client: Client,
    remotePath: string,
    data: Buffer,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<TransferResult> {
    const startTime = Date.now();
    const sftp = await this.getSFTP(client);
    const filename = remotePath.split('/').pop() || '';
    const totalBytes = data.length;

    return new Promise((resolve, reject) => {
      let bytesTransferred = 0;

      const writeStream = sftp.createWriteStream(remotePath);

      // Create a readable stream from buffer
      const readStream = new Readable({
        read() {
          // Send in chunks for progress tracking
          const chunkSize = 64 * 1024; // 64KB chunks
          if (bytesTransferred < totalBytes) {
            const chunk = data.slice(bytesTransferred, bytesTransferred + chunkSize);
            bytesTransferred += chunk.length;

            if (onProgress) {
              onProgress({
                filename,
                bytesTransferred,
                totalBytes,
                percentage: Math.round((bytesTransferred / totalBytes) * 100),
              });
            }

            this.push(chunk);
          } else {
            this.push(null);
          }
        },
      });

      writeStream.on('close', () => {
        sftp.end();
        resolve({
          success: true,
          filename,
          remotePath,
          size: totalBytes,
          duration: Date.now() - startTime,
        });
      });

      writeStream.on('error', (err: Error) => {
        sftp.end();
        reject(new Error(`Upload failed: ${err.message}`));
      });

      readStream.pipe(writeStream);
    });
  }

  /**
   * Delete file or directory
   */
  async delete(client: Client, remotePath: string, recursive: boolean = false): Promise<void> {
    const sftp = await this.getSFTP(client);

    try {
      const stats = await this.getFileStats(sftp, remotePath);

      if (stats.isDirectory) {
        if (recursive) {
          await this.deleteDirectoryRecursive(sftp, remotePath);
        } else {
          await new Promise<void>((resolve, reject) => {
            sftp.rmdir(remotePath, (err) => {
              if (err) reject(new Error(`Failed to delete directory: ${err.message}`));
              else resolve();
            });
          });
        }
      } else {
        await new Promise<void>((resolve, reject) => {
          sftp.unlink(remotePath, (err) => {
            if (err) reject(new Error(`Failed to delete file: ${err.message}`));
            else resolve();
          });
        });
      }
    } finally {
      sftp.end();
    }
  }

  /**
   * Create directory
   */
  async createDirectory(client: Client, remotePath: string, recursive: boolean = true): Promise<void> {
    const sftp = await this.getSFTP(client);

    try {
      if (recursive) {
        const parts = remotePath.split('/').filter(Boolean);
        let currentPath = remotePath.startsWith('/') ? '' : '.';

        for (const part of parts) {
          currentPath = `${currentPath}/${part}`;
          try {
            await this.getFileStats(sftp, currentPath);
          } catch {
            // Directory doesn't exist, create it
            await new Promise<void>((resolve, reject) => {
              sftp.mkdir(currentPath, (err) => {
                if (err && err.message !== 'Failure') {
                  reject(new Error(`Failed to create directory: ${err.message}`));
                } else {
                  resolve();
                }
              });
            });
          }
        }
      } else {
        await new Promise<void>((resolve, reject) => {
          sftp.mkdir(remotePath, (err) => {
            if (err) reject(new Error(`Failed to create directory: ${err.message}`));
            else resolve();
          });
        });
      }
    } finally {
      sftp.end();
    }
  }

  /**
   * Rename/move file or directory
   */
  async rename(client: Client, oldPath: string, newPath: string): Promise<void> {
    const sftp = await this.getSFTP(client);

    return new Promise((resolve, reject) => {
      sftp.rename(oldPath, newPath, (err) => {
        sftp.end();
        if (err) {
          reject(new Error(`Failed to rename: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Get file/directory stats
   */
  async stat(client: Client, remotePath: string): Promise<FileInfo> {
    const sftp = await this.getSFTP(client);

    try {
      const stats = await this.getFileStats(sftp, remotePath);
      const mode = stats.mode || 0;

      return {
        filename: remotePath.split('/').pop() || '',
        path: remotePath,
        size: stats.size || 0,
        modifyTime: new Date((stats.mtime || 0) * 1000),
        accessTime: new Date((stats.atime || 0) * 1000),
        isDirectory: (mode & 0o40000) === 0o40000,
        isFile: (mode & 0o100000) === 0o100000,
        isSymlink: (mode & 0o120000) === 0o120000,
        permissions: this.formatPermissions(mode),
        owner: stats.uid || 0,
        group: stats.gid || 0,
      };
    } finally {
      sftp.end();
    }
  }

  /**
   * Check if path exists
   */
  async exists(client: Client, remotePath: string): Promise<boolean> {
    try {
      await this.stat(client, remotePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read file as text
   */
  async readTextFile(client: Client, remotePath: string, maxSizeBytes: number = 10 * 1024 * 1024): Promise<string> {
    const { data, size } = await this.downloadFile(client, remotePath);

    if (size > maxSizeBytes) {
      throw new Error(`File too large: ${size} bytes (max: ${maxSizeBytes})`);
    }

    return data.toString('utf-8');
  }

  /**
   * Write text to file
   */
  async writeTextFile(client: Client, remotePath: string, content: string): Promise<TransferResult> {
    const buffer = Buffer.from(content, 'utf-8');
    return this.uploadFile(client, remotePath, buffer);
  }

  /**
   * Helper: Get file stats from SFTP wrapper
   */
  private getFileStats(sftp: SFTPWrapper, path: string): Promise<{
    mode?: number;
    size?: number;
    mtime?: number;
    atime?: number;
    uid?: number;
    gid?: number;
    isDirectory: boolean;
  }> {
    return new Promise((resolve, reject) => {
      sftp.stat(path, (err, stats) => {
        if (err) {
          reject(new Error(`Failed to get stats: ${err.message}`));
        } else {
          resolve({
            ...stats,
            isDirectory: (stats.mode & 0o40000) === 0o40000,
          });
        }
      });
    });
  }

  /**
   * Helper: Delete directory recursively
   */
  private async deleteDirectoryRecursive(sftp: SFTPWrapper, dirPath: string): Promise<void> {
    const list = await new Promise<{ filename: string; attrs: { mode: number } }[]>((resolve, reject) => {
      sftp.readdir(dirPath, (err, list) => {
        if (err) reject(new Error(`Failed to read directory: ${err.message}`));
        else resolve(list as { filename: string; attrs: { mode: number } }[]);
      });
    });

    for (const item of list) {
      const itemPath = `${dirPath}/${item.filename}`;
      const isDir = (item.attrs.mode & 0o40000) === 0o40000;

      if (isDir) {
        await this.deleteDirectoryRecursive(sftp, itemPath);
      } else {
        await new Promise<void>((resolve, reject) => {
          sftp.unlink(itemPath, (err) => {
            if (err) reject(new Error(`Failed to delete file: ${err.message}`));
            else resolve();
          });
        });
      }
    }

    // Delete the now-empty directory
    await new Promise<void>((resolve, reject) => {
      sftp.rmdir(dirPath, (err) => {
        if (err) reject(new Error(`Failed to delete directory: ${err.message}`));
        else resolve();
      });
    });
  }

  /**
   * Helper: Format permissions as string (e.g., "rwxr-xr-x")
   */
  private formatPermissions(mode: number): string {
    const permissions = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
    const owner = permissions[(mode >> 6) & 7];
    const group = permissions[(mode >> 3) & 7];
    const other = permissions[mode & 7];
    return `${owner}${group}${other}`;
  }
}

export const sftpService = new SFTPService();
export default sftpService;
