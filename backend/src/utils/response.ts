import { Response } from 'express';

export function sendSuccess(res: Response, message: string, data: unknown = {}, statusCode: number = 200): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(res: Response, message: string, statusCode: number = 400): void {
  res.status(statusCode).json({
    success: false,
    message,
  });
}