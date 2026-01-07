import { Request, Response } from 'express';
import { asyncHandler } from '../middleware';
import { Instance } from '../models/Instance';
import { sshService } from '../services/sshService';
import { preflightService } from '../services/preflightService';
import { sftpService } from '../services/sftpService';
import { clipboardService } from '../services/clipboardService';
import { databaseService, DatabaseConnection } from '../services/databaseService';
import { portForwardingService } from '../services/portForwardingService';
import { NotFoundError, ValidationError } from '../utils/errors';
import { ERROR_CODES, HTTP_STATUS, DEV_SOFTWARE_TEMPLATES, DevSoftwareTemplate } from '../config/constants';
import { SSHConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Store active port forwards and SSH clients per user/instance
const activePortForwards: Map<string, { sshClient: any; forwardIds: string[] }> = new Map();

/**
 * Run pre-flight check on an instance
 * POST /api/instances/:id/preflight
 */
export const runPreflightCheck = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId } = req.params;
  const { password } = req.body;

  if (!password) {
    throw new ValidationError('Password is required to decrypt credentials');
  }

  const instance = await Instance.findByUserIdAndId(userId, instanceId);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  // Build SSH config
  const sshConfig: SSHConfig = {
    host: instance.host,
    port: instance.port,
    username: instance.username,
  };

  const credential = instance.getFullyDecryptedCredential(password);
  if (instance.authType === 'key') {
    sshConfig.privateKey = credential;
  } else {
    sshConfig.password = credential;
  }

  let sshClient;
  try {
    sshClient = await sshService.createConnection(sshConfig);
    const result = await preflightService.runPreflightCheck(sshClient, instance);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  } finally {
    if (sshClient) {
      sshService.closeConnection(sshClient);
    }
  }
});

/**
 * Dry run VNC provisioning
 * POST /api/instances/:id/provision/dry-run
 */
export const dryRunProvisioning = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId } = req.params;
  const { password, desktopEnvironment = 'xfce' } = req.body;

  if (!password) {
    throw new ValidationError('Password is required to decrypt credentials');
  }

  const instance = await Instance.findByUserIdAndId(userId, instanceId);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const sshConfig: SSHConfig = {
    host: instance.host,
    port: instance.port,
    username: instance.username,
  };

  const credential = instance.getFullyDecryptedCredential(password);
  if (instance.authType === 'key') {
    sshConfig.privateKey = credential;
  } else {
    sshConfig.password = credential;
  }

  let sshClient;
  try {
    sshClient = await sshService.createConnection(sshConfig);
    const result = await preflightService.dryRunProvisioning(sshClient, desktopEnvironment);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  } finally {
    if (sshClient) {
      sshService.closeConnection(sshClient);
    }
  }
});

/**
 * Get available dev software templates
 * GET /api/instances/:id/software/templates
 */
export const getDevSoftwareTemplates = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId } = req.params;

  const instance = await Instance.findOne({ _id: instanceId, userId });
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const templates = await preflightService.getAvailableTemplates(instance);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: templates,
  });
});

/**
 * Install dev software template
 * POST /api/instances/:id/software/install
 */
export const installDevSoftware = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId } = req.params;
  const { password, templateId } = req.body;

  if (!password) {
    throw new ValidationError('Password is required to decrypt credentials');
  }

  if (!templateId || !DEV_SOFTWARE_TEMPLATES[templateId as DevSoftwareTemplate]) {
    throw new ValidationError('Invalid software template ID');
  }

  const instance = await Instance.findByUserIdAndId(userId, instanceId);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const sshConfig: SSHConfig = {
    host: instance.host,
    port: instance.port,
    username: instance.username,
  };

  const credential = instance.getFullyDecryptedCredential(password);
  if (instance.authType === 'key') {
    sshConfig.privateKey = credential;
  } else {
    sshConfig.password = credential;
  }

  let sshClient;
  try {
    sshClient = await sshService.createConnection(sshConfig);
    const result = await preflightService.installDevSoftware(
      sshClient,
      instance,
      templateId as DevSoftwareTemplate
    );

    res.status(HTTP_STATUS.OK).json({
      success: true, // Always true so frontend can access detailed result
      data: result,
    });
  } finally {
    if (sshClient) {
      sshService.closeConnection(sshClient);
    }
  }
});

/**
 * List directory via SFTP
 * POST /api/instances/:id/files/list
 */
export const listDirectory = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId } = req.params;
  const { password, path = '~' } = req.body;

  if (!password) {
    throw new ValidationError('Password is required to decrypt credentials');
  }

  const instance = await Instance.findByUserIdAndId(userId, instanceId);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const sshConfig: SSHConfig = {
    host: instance.host,
    port: instance.port,
    username: instance.username,
  };

  const credential = instance.getFullyDecryptedCredential(password);
  if (instance.authType === 'key') {
    sshConfig.privateKey = credential;
  } else {
    sshConfig.password = credential;
  }

  let sshClient;
  try {
    sshClient = await sshService.createConnection(sshConfig);

    // Expand ~ to home directory
    let resolvedPath = path;
    if (path === '~' || path.startsWith('~/')) {
      const homeResult = await sshService.executeCommand(sshClient, 'echo $HOME');
      const home = homeResult.stdout.trim();
      resolvedPath = path === '~' ? home : path.replace('~', home);
    }

    const result = await sftpService.listDirectory(sshClient, resolvedPath);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  } finally {
    if (sshClient) {
      sshService.closeConnection(sshClient);
    }
  }
});

/**
 * Download file via SFTP
 * POST /api/instances/:id/files/download
 */
export const downloadFile = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId } = req.params;
  const { password, path } = req.body;

  if (!password) {
    throw new ValidationError('Password is required to decrypt credentials');
  }

  if (!path) {
    throw new ValidationError('File path is required');
  }

  const instance = await Instance.findByUserIdAndId(userId, instanceId);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const sshConfig: SSHConfig = {
    host: instance.host,
    port: instance.port,
    username: instance.username,
  };

  const credential = instance.getFullyDecryptedCredential(password);
  if (instance.authType === 'key') {
    sshConfig.privateKey = credential;
  } else {
    sshConfig.password = credential;
  }

  let sshClient;
  try {
    sshClient = await sshService.createConnection(sshConfig);
    const { data, size } = await sftpService.downloadFile(sshClient, path);

    const filename = path.split('/').pop() || 'download';

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', size);
    res.send(data);
  } finally {
    if (sshClient) {
      sshService.closeConnection(sshClient);
    }
  }
});

/**
 * Upload file via SFTP
 * POST /api/instances/:id/files/upload
 */
export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId } = req.params;
  const { password, path, content, encoding = 'base64' } = req.body;

  if (!password) {
    throw new ValidationError('Password is required to decrypt credentials');
  }

  if (!path || !content) {
    throw new ValidationError('File path and content are required');
  }

  const instance = await Instance.findByUserIdAndId(userId, instanceId);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const sshConfig: SSHConfig = {
    host: instance.host,
    port: instance.port,
    username: instance.username,
  };

  const credential = instance.getFullyDecryptedCredential(password);
  if (instance.authType === 'key') {
    sshConfig.privateKey = credential;
  } else {
    sshConfig.password = credential;
  }

  let sshClient;
  try {
    sshClient = await sshService.createConnection(sshConfig);

    // Convert content to buffer based on encoding
    const buffer = encoding === 'base64'
      ? Buffer.from(content, 'base64')
      : Buffer.from(content, 'utf-8');

    const result = await sftpService.uploadFile(sshClient, path, buffer);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  } finally {
    if (sshClient) {
      sshService.closeConnection(sshClient);
    }
  }
});

/**
 * Delete file or directory via SFTP
 * POST /api/instances/:id/files/delete
 */
export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId } = req.params;
  const { password, path, recursive = false } = req.body;

  if (!password) {
    throw new ValidationError('Password is required to decrypt credentials');
  }

  if (!path) {
    throw new ValidationError('File path is required');
  }

  const instance = await Instance.findByUserIdAndId(userId, instanceId);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const sshConfig: SSHConfig = {
    host: instance.host,
    port: instance.port,
    username: instance.username,
  };

  const credential = instance.getFullyDecryptedCredential(password);
  if (instance.authType === 'key') {
    sshConfig.privateKey = credential;
  } else {
    sshConfig.password = credential;
  }

  let sshClient;
  try {
    sshClient = await sshService.createConnection(sshConfig);
    await sftpService.delete(sshClient, path, recursive);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'File deleted successfully',
    });
  } finally {
    if (sshClient) {
      sshService.closeConnection(sshClient);
    }
  }
});

/**
 * Create directory via SFTP
 * POST /api/instances/:id/files/mkdir
 */
export const createDirectory = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId } = req.params;
  const { password, path } = req.body;

  if (!password) {
    throw new ValidationError('Password is required to decrypt credentials');
  }

  if (!path) {
    throw new ValidationError('Directory path is required');
  }

  const instance = await Instance.findByUserIdAndId(userId, instanceId);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const sshConfig: SSHConfig = {
    host: instance.host,
    port: instance.port,
    username: instance.username,
  };

  const credential = instance.getFullyDecryptedCredential(password);
  if (instance.authType === 'key') {
    sshConfig.privateKey = credential;
  } else {
    sshConfig.password = credential;
  }

  let sshClient;
  try {
    sshClient = await sshService.createConnection(sshConfig);
    await sftpService.createDirectory(sshClient, path);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Directory created successfully',
    });
  } finally {
    if (sshClient) {
      sshService.closeConnection(sshClient);
    }
  }
});

/**
 * Get clipboard content from VNC session
 * POST /api/sessions/:sessionId/clipboard/get
 */
export const getClipboard = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { sessionId } = req.params;
  const { password, displayNumber } = req.body;

  if (!password || displayNumber === undefined) {
    throw new ValidationError('Password and displayNumber are required');
  }

  // Get session and verify ownership
  const Session = (await import('../models/Session')).Session;
  const session = await Session.findOne({ _id: sessionId, userId }).populate('instanceId');

  if (!session) {
    throw new NotFoundError('Session not found', ERROR_CODES.SESSION_NOT_FOUND);
  }

  const instance = await Instance.findByUserIdAndId(userId, (session.instanceId as any)._id);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const sshConfig: SSHConfig = {
    host: instance.host,
    port: instance.port,
    username: instance.username,
  };

  const credential = instance.getFullyDecryptedCredential(password);
  if (instance.authType === 'key') {
    sshConfig.privateKey = credential;
  } else {
    sshConfig.password = credential;
  }

  let sshClient;
  try {
    sshClient = await sshService.createConnection(sshConfig);
    const result = await clipboardService.syncRemoteToLocal(sshClient, displayNumber);

    res.status(HTTP_STATUS.OK).json({
      success: true, // Always true so frontend can access detailed result
      data: { content: result.content },
      error: result.error,
    });
  } finally {
    if (sshClient) {
      sshService.closeConnection(sshClient);
    }
  }
});

/**
 * Set clipboard content on VNC session
 * POST /api/sessions/:sessionId/clipboard/set
 */
export const setClipboard = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { sessionId } = req.params;
  const { password, displayNumber, content } = req.body;

  if (!password || displayNumber === undefined || content === undefined) {
    throw new ValidationError('Password, displayNumber, and content are required');
  }

  const Session = (await import('../models/Session')).Session;
  const session = await Session.findOne({ _id: sessionId, userId }).populate('instanceId');

  if (!session) {
    throw new NotFoundError('Session not found', ERROR_CODES.SESSION_NOT_FOUND);
  }

  const instance = await Instance.findByUserIdAndId(userId, (session.instanceId as any)._id);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const sshConfig: SSHConfig = {
    host: instance.host,
    port: instance.port,
    username: instance.username,
  };

  const credential = instance.getFullyDecryptedCredential(password);
  if (instance.authType === 'key') {
    sshConfig.privateKey = credential;
  } else {
    sshConfig.password = credential;
  }

  let sshClient;
  try {
    sshClient = await sshService.createConnection(sshConfig);
    const result = await clipboardService.syncLocalToRemote(sshClient, displayNumber, content);

    res.status(HTTP_STATUS.OK).json({
      success: true, // Always true so frontend can access detailed result
      error: result.error,
    });
  } finally {
    if (sshClient) {
      sshService.closeConnection(sshClient);
    }
  }
});

/**
 * Get OS info for an instance
 * GET /api/instances/:id/os-info
 */
export const getOSInfo = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId } = req.params;

  const instance = await Instance.findOne({ _id: instanceId, userId });
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      osInfo: instance.osInfo,
      lastPreflightCheck: instance.lastPreflightCheck,
      preflightStatus: instance.preflightStatus,
      preflightMessage: instance.preflightMessage,
      installedSoftware: instance.installedSoftware,
    },
  });
});

// ============================================
// Database GUI Features
// ============================================

/**
 * Detect available database clients on instance
 * POST /api/instances/:id/database/detect
 */
export const detectDatabases = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId } = req.params;
  const { password } = req.body;

  if (!password) {
    throw new ValidationError('Password is required to decrypt credentials');
  }

  const instance = await Instance.findByUserIdAndId(userId, instanceId);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const sshConfig: SSHConfig = {
    host: instance.host,
    port: instance.port,
    username: instance.username,
  };

  const credential = instance.getFullyDecryptedCredential(password);
  if (instance.authType === 'key') {
    sshConfig.privateKey = credential;
  } else {
    sshConfig.password = credential;
  }

  let sshClient;
  try {
    sshClient = await sshService.createConnection(sshConfig);
    const databases = await databaseService.detectDatabases(sshClient);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: databases,
    });
  } finally {
    if (sshClient) {
      sshService.closeConnection(sshClient);
    }
  }
});

/**
 * List databases on instance
 * POST /api/instances/:id/database/list
 */
export const listDatabases = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId } = req.params;
  const { password, connection } = req.body;

  if (!password) {
    throw new ValidationError('Password is required to decrypt credentials');
  }

  if (!connection || !connection.type) {
    throw new ValidationError('Database connection configuration is required');
  }

  const instance = await Instance.findByUserIdAndId(userId, instanceId);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const sshConfig: SSHConfig = {
    host: instance.host,
    port: instance.port,
    username: instance.username,
  };

  const credential = instance.getFullyDecryptedCredential(password);
  if (instance.authType === 'key') {
    sshConfig.privateKey = credential;
  } else {
    sshConfig.password = credential;
  }

  let sshClient;
  try {
    sshClient = await sshService.createConnection(sshConfig);
    const databases = await databaseService.listDatabases(sshClient, connection as DatabaseConnection);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: databases,
    });
  } finally {
    if (sshClient) {
      sshService.closeConnection(sshClient);
    }
  }
});

/**
 * List tables/collections in a database
 * POST /api/instances/:id/database/tables
 */
export const listTables = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId } = req.params;
  const { password, connection } = req.body;

  if (!password) {
    throw new ValidationError('Password is required to decrypt credentials');
  }

  if (!connection || !connection.type || !connection.database) {
    throw new ValidationError('Database connection with database name is required');
  }

  const instance = await Instance.findByUserIdAndId(userId, instanceId);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const sshConfig: SSHConfig = {
    host: instance.host,
    port: instance.port,
    username: instance.username,
  };

  const credential = instance.getFullyDecryptedCredential(password);
  if (instance.authType === 'key') {
    sshConfig.privateKey = credential;
  } else {
    sshConfig.password = credential;
  }

  let sshClient;
  try {
    sshClient = await sshService.createConnection(sshConfig);
    const tables = await databaseService.listTables(sshClient, connection as DatabaseConnection);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: tables,
    });
  } finally {
    if (sshClient) {
      sshService.closeConnection(sshClient);
    }
  }
});

/**
 * Get table schema
 * POST /api/instances/:id/database/schema
 */
export const getTableSchema = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId } = req.params;
  const { password, connection, tableName } = req.body;

  if (!password) {
    throw new ValidationError('Password is required to decrypt credentials');
  }

  if (!connection || !connection.type || !tableName) {
    throw new ValidationError('Database connection and table name are required');
  }

  const instance = await Instance.findByUserIdAndId(userId, instanceId);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const sshConfig: SSHConfig = {
    host: instance.host,
    port: instance.port,
    username: instance.username,
  };

  const credential = instance.getFullyDecryptedCredential(password);
  if (instance.authType === 'key') {
    sshConfig.privateKey = credential;
  } else {
    sshConfig.password = credential;
  }

  let sshClient;
  try {
    sshClient = await sshService.createConnection(sshConfig);
    const schema = await databaseService.getTableSchema(sshClient, connection as DatabaseConnection, tableName);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: schema,
    });
  } finally {
    if (sshClient) {
      sshService.closeConnection(sshClient);
    }
  }
});

/**
 * Execute database query
 * POST /api/instances/:id/database/query
 */
export const executeQuery = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId } = req.params;
  const { password, connection, query } = req.body;

  if (!password) {
    throw new ValidationError('Password is required to decrypt credentials');
  }

  if (!connection || !connection.type || !query) {
    throw new ValidationError('Database connection and query are required');
  }

  const instance = await Instance.findByUserIdAndId(userId, instanceId);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const sshConfig: SSHConfig = {
    host: instance.host,
    port: instance.port,
    username: instance.username,
  };

  const credential = instance.getFullyDecryptedCredential(password);
  if (instance.authType === 'key') {
    sshConfig.privateKey = credential;
  } else {
    sshConfig.password = credential;
  }

  let sshClient;
  try {
    sshClient = await sshService.createConnection(sshConfig);
    const result = await databaseService.executeQuery(sshClient, connection as DatabaseConnection, query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  } finally {
    if (sshClient) {
      sshService.closeConnection(sshClient);
    }
  }
});

// ============================================
// Port Forwarding Features
// ============================================

/**
 * Create a port forward
 * POST /api/instances/:id/port-forward/create
 */
export const createPortForward = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId } = req.params;
  const { password, localPort, remoteHost, remotePort } = req.body;

  if (!password) {
    throw new ValidationError('Password is required to decrypt credentials');
  }

  if (!localPort || !remotePort) {
    throw new ValidationError('Local and remote ports are required');
  }

  const instance = await Instance.findByUserIdAndId(userId, instanceId);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const sshConfig: SSHConfig = {
    host: instance.host,
    port: instance.port,
    username: instance.username,
  };

  const credential = instance.getFullyDecryptedCredential(password);
  if (instance.authType === 'key') {
    sshConfig.privateKey = credential;
  } else {
    sshConfig.password = credential;
  }

  const forwardKey = `${userId}:${instanceId}`;
  let clientData = activePortForwards.get(forwardKey);

  try {
    // Create SSH connection if not exists
    if (!clientData) {
      const sshClient = await sshService.createConnection(sshConfig);
      clientData = { sshClient, forwardIds: [] };
      activePortForwards.set(forwardKey, clientData);
    }

    const forwardId = uuidv4();
    const result = await portForwardingService.createForward(forwardId, clientData.sshClient, {
      localPort,
      remoteHost: remoteHost || 'localhost',
      remotePort,
    });

    clientData.forwardIds.push(forwardId);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: {
        ...result,
        userId,
        instanceId,
      },
    });
  } catch (error) {
    // Clean up on error
    if (clientData && clientData.forwardIds.length === 0) {
      sshService.closeConnection(clientData.sshClient);
      activePortForwards.delete(forwardKey);
    }
    throw error;
  }
});

/**
 * Stop a port forward
 * POST /api/instances/:id/port-forward/:forwardId/stop
 */
export const stopPortForward = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId, forwardId } = req.params;

  const instance = await Instance.findByUserIdAndId(userId, instanceId);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const forwardKey = `${userId}:${instanceId}`;
  const clientData = activePortForwards.get(forwardKey);

  if (!clientData || !clientData.forwardIds.includes(forwardId)) {
    throw new NotFoundError('Port forward not found');
  }

  portForwardingService.stopForward(forwardId);
  clientData.forwardIds = clientData.forwardIds.filter((id: string) => id !== forwardId);

  // Clean up SSH client if no more forwards
  if (clientData.forwardIds.length === 0) {
    sshService.closeConnection(clientData.sshClient);
    activePortForwards.delete(forwardKey);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Port forward stopped',
  });
});

/**
 * List active port forwards for an instance
 * GET /api/instances/:id/port-forward/list
 */
export const listPortForwards = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId } = req.params;

  const instance = await Instance.findByUserIdAndId(userId, instanceId);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const forwardKey = `${userId}:${instanceId}`;
  const clientData = activePortForwards.get(forwardKey);

  if (!clientData) {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: [],
    });
    return;
  }

  const forwards = clientData.forwardIds
    .map((id: string) => portForwardingService.getForwardStatus(id))
    .filter(Boolean)
    .map((forward: any) => ({
      ...forward,
      userId,
      instanceId,
    }));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: forwards,
  });
});

/**
 * Get an available port for forwarding
 * GET /api/instances/:id/port-forward/available-port
 */
export const getAvailablePort = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const { id: instanceId } = req.params;

  const instance = await Instance.findByUserIdAndId(userId, instanceId);
  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const port = await portForwardingService.getAvailablePort();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { port },
  });
});
