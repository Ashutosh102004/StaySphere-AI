import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/response';

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 'AUTHENTICATION_ERROR', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        'You do not have permission to perform this action',
        'AUTHORIZATION_ERROR',
        403
      );
    }

    next();
  };
};
