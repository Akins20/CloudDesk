import { Request, Response, NextFunction } from 'express';
import * as licenseService from '../services/licenseService';

/**
 * Validate a license key (called by self-hosted instances)
 */
export async function validate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { licenseKey, instanceId, hostname } = req.body;

    const result = await licenseService.validateLicense(
      licenseKey,
      instanceId,
      hostname,
      req.ip
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get license status (public, rate-limited)
 */
export async function getStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { key } = req.params;

    if (!key) {
      res.status(400).json({
        success: false,
        error: { message: 'License key is required', code: 'VALIDATION_ERROR' },
      });
      return;
    }

    const status = await licenseService.getLicenseStatus(key);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
}
