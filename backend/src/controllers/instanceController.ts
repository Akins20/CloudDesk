import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Instance } from '../models/Instance';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { sshService } from '../services/sshService';
import { encryptionService } from '../services/encryptionService';
import { asyncHandler, AuthRequest, getClientIp, getUserAgent } from '../middleware';
import { HTTP_STATUS, ERROR_CODES, AUDIT_ACTIONS } from '../config/constants';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { CreateInstanceDTO, UpdateInstanceDTO, SSHConfig, InstanceQuery } from '../types';

/**
 * Get all instances for the current user
 * GET /api/instances
 */
export const getInstances = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const query: InstanceQuery = req.query;

  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    provider,
    status,
    tags,
  } = query;

  // Build filter
  const filter: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { host: { $regex: search, $options: 'i' } },
    ];
  }

  if (provider) {
    filter.provider = provider;
  }

  if (status) {
    filter.status = status;
  }

  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    filter.tags = { $in: tagArray };
  }

  // Build sort
  const sortDir = sortOrder === 'asc' ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [sortBy]: sortDir };

  const pageNum = Number(page);
  const limitNum = Number(limit);

  const [instances, total] = await Promise.all([
    Instance.find(filter)
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Instance.countDocuments(filter),
  ]);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: instances,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * Get instance by ID
 * GET /api/instances/:id
 */
export const getInstanceById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { id } = req.params;

  const instance = await Instance.findOne({
    _id: id,
    userId,
  });

  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: instance,
  });
});

/**
 * Create a new instance
 * POST /api/instances
 */
export const createInstance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const data: CreateInstanceDTO = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  // Verify user's password before creating instance with encrypted credentials
  if (data.password) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          message: 'User not found',
          code: ERROR_CODES.USER_NOT_FOUND,
        },
      });
      return;
    }

    if (!user.password) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Account password not set. Please set a password in your profile settings.',
          code: 'PASSWORD_NOT_SET',
        },
      });
      return;
    }

    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          message: 'Incorrect password. Please enter your correct account password.',
          code: ERROR_CODES.INCORRECT_PASSWORD,
        },
      });
      return;
    }
  }

  // Encrypt the credential
  const encryptedCredential = encryptionService.encrypt(data.credential);

  const instance = new Instance({
    userId: new mongoose.Types.ObjectId(userId),
    name: data.name,
    provider: data.provider,
    host: data.host,
    port: data.port || 22,
    username: data.username,
    authType: data.authType,
    encryptedCredential,
    tags: data.tags || [],
  });

  await instance.save();

  // Log audit
  await AuditLog.logAction({
    userId,
    action: AUDIT_ACTIONS.INSTANCE_CREATE,
    resource: instance.name,
    status: 'success',
    ipAddress,
    userAgent,
    details: { instanceId: instance._id.toString() },
  });

  logger.info(`Instance created: ${instance.name} by user ${userId}`);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: instance,
  });
});

/**
 * Update an instance
 * PUT /api/instances/:id
 */
export const updateInstance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { id } = req.params;
  const data: UpdateInstanceDTO = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const instance = await Instance.findOne({
    _id: id,
    userId,
  });

  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  // Update fields
  if (data.name !== undefined) instance.name = data.name;
  if (data.provider !== undefined) instance.provider = data.provider;
  if (data.host !== undefined) instance.host = data.host;
  if (data.port !== undefined) instance.port = data.port;
  if (data.username !== undefined) instance.username = data.username;
  if (data.authType !== undefined) instance.authType = data.authType;
  if (data.tags !== undefined) instance.tags = data.tags;
  if (data.status !== undefined) instance.status = data.status;

  // If credential is being updated, encrypt it
  if (data.credential !== undefined) {
    instance.encryptedCredential = encryptionService.encrypt(data.credential);
  }

  await instance.save();

  // Log audit
  await AuditLog.logAction({
    userId,
    action: AUDIT_ACTIONS.INSTANCE_UPDATE,
    resource: instance.name,
    status: 'success',
    ipAddress,
    userAgent,
    details: { instanceId: id, updatedFields: Object.keys(data) },
  });

  logger.info(`Instance updated: ${instance.name} by user ${userId}`);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: instance,
  });
});

/**
 * Delete an instance
 * DELETE /api/instances/:id
 */
export const deleteInstance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { id } = req.params;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const instance = await Instance.findOne({
    _id: id,
    userId,
  });

  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  const instanceName = instance.name;

  await Instance.deleteOne({ _id: id });

  // Log audit
  await AuditLog.logAction({
    userId,
    action: AUDIT_ACTIONS.INSTANCE_DELETE,
    resource: instanceName,
    status: 'success',
    ipAddress,
    userAgent,
    details: { instanceId: id },
  });

  logger.info(`Instance deleted: ${instanceName} by user ${userId}`);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { message: 'Instance deleted successfully' },
  });
});

/**
 * Test SSH connection to an instance
 * POST /api/instances/:id/test-connection
 */
export const testConnection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { id } = req.params;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const instance = await Instance.findByUserIdAndId(userId, id);

  if (!instance) {
    throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
  }

  // Build SSH config
  const sshConfig: SSHConfig = {
    host: instance.host,
    port: instance.port,
    username: instance.username,
  };

  // Get decrypted credential
  const credential = instance.getDecryptedCredential();
  if (instance.authType === 'key') {
    sshConfig.privateKey = credential;
  } else {
    sshConfig.password = credential;
  }

  // Test connection
  const success = await sshService.testConnection(sshConfig);

  // Log audit
  await AuditLog.logAction({
    userId,
    action: AUDIT_ACTIONS.INSTANCE_TEST_CONNECTION,
    resource: instance.name,
    status: success ? 'success' : 'failure',
    ipAddress,
    userAgent,
    details: { instanceId: id, success },
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      success,
      message: success ? 'Connection successful' : 'Connection failed',
    },
  });
});

export default {
  getInstances,
  getInstanceById,
  createInstance,
  updateInstance,
  deleteInstance,
  testConnection,
};
