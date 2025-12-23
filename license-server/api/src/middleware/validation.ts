import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';

/**
 * Validate request body against a Joi schema
 */
export function validateBody(schema: Joi.ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.reduce(
        (acc, detail) => {
          const key = detail.path.join('.');
          acc[key] = detail.message;
          return acc;
        },
        {} as Record<string, string>
      );

      next(new ValidationError('Validation failed', details));
      return;
    }

    req.body = value;
    next();
  };
}

/**
 * Validate request query against a Joi schema
 */
export function validateQuery(schema: Joi.ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.reduce(
        (acc, detail) => {
          const key = detail.path.join('.');
          acc[key] = detail.message;
          return acc;
        },
        {} as Record<string, string>
      );

      next(new ValidationError('Validation failed', details));
      return;
    }

    req.query = value;
    next();
  };
}

/**
 * Validate request params against a Joi schema
 */
export function validateParams(schema: Joi.ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.reduce(
        (acc, detail) => {
          const key = detail.path.join('.');
          acc[key] = detail.message;
          return acc;
        },
        {} as Record<string, string>
      );

      next(new ValidationError('Validation failed', details));
      return;
    }

    req.params = value;
    next();
  };
}
