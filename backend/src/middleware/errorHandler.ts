import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Server Error:', err);

  const status = err.status || 500;
  const message = err.message || 'An unexpected internal error occurred on MidBridge 2.0 server.';

  res.status(status).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
  });
}
