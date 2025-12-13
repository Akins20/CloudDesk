import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validation middleware factory
 * Validates request data against a Joi schema
 */
export const validate = (
  schema: Joi.Schema,
  target: ValidationTarget = 'body'
) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dataToValidate = req[target];

      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false, // Return all errors, not just the first
        stripUnknown: true, // Remove unknown keys from the validated data
        convert: true, // Convert values to their schema types
      });

      if (error) {
        const errorDetails = error.details.reduce(
          (acc: Record<string, string>, detail) => {
            const key = detail.path.join('.');
            acc[key] = detail.message;
            return acc;
          },
          {}
        );

        throw new ValidationError('Validation failed', errorDetails);
      }

      // Replace request data with validated and sanitized data
      if (target === 'body') {
        req.body = value;
      } else if (target === 'query') {
        // req.query is read-only in Express 5, so modify in place
        Object.keys(req.query).forEach(key => delete (req.query as Record<string, unknown>)[key]);
        Object.assign(req.query, value);
      } else if (target === 'params') {
        Object.assign(req.params, value);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Validate request body
 */
export const validateBody = (schema: Joi.Schema) => validate(schema, 'body');

/**
 * Validate query parameters
 */
export const validateQuery = (schema: Joi.Schema) => validate(schema, 'query');

/**
 * Validate URL parameters
 */
export const validateParams = (schema: Joi.Schema) => validate(schema, 'params');

/**
 * Combined validation for multiple targets
 */
export const validateRequest = (schemas: {
  body?: Joi.Schema;
  query?: Joi.Schema;
  params?: Joi.Schema;
}) => {
  const middlewares: Array<(req: Request, res: Response, next: NextFunction) => Promise<void>> = [];

  if (schemas.params) {
    middlewares.push(validate(schemas.params, 'params'));
  }
  if (schemas.query) {
    middlewares.push(validate(schemas.query, 'query'));
  }
  if (schemas.body) {
    middlewares.push(validate(schemas.body, 'body'));
  }

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      for (const middleware of middlewares) {
        await new Promise<void>((resolve, reject) => {
          middleware(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateRequest,
};
