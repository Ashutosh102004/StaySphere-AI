import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema } from './auth.validation';
import { asyncHandler } from '@/utils/async-handler';
import { ApiResponse } from '@/utils/response';

const authService = new AuthService();

export const register = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = registerSchema.parse(req.body);
  const result = await authService.register(validatedData);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return ApiResponse.success(res, {
    user: {
      id: result.user._id,
      email: result.user.email,
      role: result.user.role,
      emailVerified: result.user.emailVerified,
    },
    accessToken: result.accessToken,
  }, 'Registration successful', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = loginSchema.parse(req.body);
  const result = await authService.login(validatedData);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return ApiResponse.success(res, {
    user: {
      id: result.user._id,
      email: result.user.email,
      role: result.user.role,
      emailVerified: result.user.emailVerified,
    },
    accessToken: result.accessToken,
  }, 'Login successful');
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  return ApiResponse.success(res, null, 'Logout successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return ApiResponse.error(res, 'Refresh token not found', 'AUTHENTICATION_ERROR', 401);
  }

  const result = await authService.refreshAccessToken(refreshToken);
  return ApiResponse.success(res, { accessToken: result.accessToken }, 'Token refreshed');
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  return ApiResponse.success(res, {
    user: req.user,
  }, 'User retrieved');
});
