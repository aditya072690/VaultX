import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400);
  }
}

export class QuotaExceededError extends AppError {
  code: string;
  storageUsed: number;
  storageLimit: number;
  trashSize?: number;

  constructor(
    message: string = 'Storage quota exceeded. Please delete files or upgrade your plan.',
    storageUsed: number = 0,
    storageLimit: number = 0,
    trashSize: number = 0
  ) {
    super(message, 413);
    this.code = 'STORAGE_QUOTA_EXCEEDED';
    this.storageUsed = storageUsed;
    this.storageLimit = storageLimit;
    this.trashSize = trashSize;
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: (err as any).code,
      storageUsed: (err as any).storageUsed,
      storageLimit: (err as any).storageLimit,
      trashSize: (err as any).trashSize,
    });
    return;
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
};
