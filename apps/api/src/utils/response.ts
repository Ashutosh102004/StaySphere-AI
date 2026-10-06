import { Response } from 'express';
import { ZodIssue } from 'zod';

export class ApiResponse {
  static success(res: Response, data: unknown = null, message: string = 'Success', statusCode: number = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
    });
  }

  static error(res: Response, message: string, code: string = 'ERROR', statusCode: number = 400) {
    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
      },
    });
  }

  static validationError(res: Response, errors: ZodIssue[]) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors,
      },
    });
  }
}
