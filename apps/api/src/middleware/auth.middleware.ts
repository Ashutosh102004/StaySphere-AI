import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/modules/auth/auth.service';
import { ApiResponse } from '@/utils/response';

const authService = new AuthService();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ApiResponse.error(res, 'No token provided', 'AUTHENTICATION_ERROR', 401);
      return;
    }

    const token = authHeader.substring(7);
    const decoded = await authService.verifyToken(token);

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    ApiResponse.error(res, 'Invalid or expired token', 'AUTHENTICATION_ERROR', 401);
  }
};
