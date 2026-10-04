import { Request, Response } from 'express';
import { IdentityVerificationService } from './identity.service';
import {
  initiateVerificationSchema,
  initiateVerificationWithDocumentSchema,
  handleVerificationCallbackSchema,
  retryVerificationSchema,
} from './identity.validation';
import { asyncHandler } from '@/utils/async-handler';
import { ApiResponse } from '@/utils/response';

const identityService = new IdentityVerificationService();

export const initiateVerification = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = initiateVerificationSchema.parse(req.body);

  const verification = await identityService.initiateVerification(req.user!.id, validatedData);

  const mockData = await identityService.getMockVerificationData();

  return ApiResponse.success(
    res,
    {
      verification: {
        id: verification._id,
        status: verification.status,
        provider: verification.provider,
        sessionId: verification.providerSessionId,
      },
      sessionUrl: validatedData.provider === 'mock' ? mockData.sessionUrl : null,
    },
    'Verification initiated successfully',
    201
  );
});

export const initiateVerificationWithDocument = asyncHandler(
  async (req: Request, res: Response) => {
    const validatedData = initiateVerificationWithDocumentSchema.parse(req.body);

    const verification = await identityService.initiateVerificationWithDocument(
      req.user!.id,
      validatedData
    );

    return ApiResponse.success(
      res,
      {
        verification: {
          id: verification._id,
          status: verification.status,
          provider: verification.provider,
          sessionId: verification.providerSessionId,
        },
      },
      'Document verification initiated successfully',
      201
    );
  }
);

export const handleVerificationCallback = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = handleVerificationCallbackSchema.parse(req.body);

  const verification = await identityService.handleVerificationCallback(
    validatedData.sessionId,
    validatedData
  );

  return ApiResponse.success(
    res,
    {
      verification: {
        id: verification._id,
        status: verification.status,
        userId: verification.userId,
      },
    },
    'Verification callback processed'
  );
});

export const getVerificationStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId ? (req.query.userId as string) : req.user!.id;

  // Authorization: users can only view their own status, admins can view any
  if (userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return ApiResponse.error(
      res,
      'You do not have permission to view this verification status',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const verification = await identityService.getVerificationStatus(userId);

  if (!verification) {
    return ApiResponse.success(res, {
      verification: null,
      status: 'NOT_STARTED',
    });
  }

  return ApiResponse.success(res, {
    verification: {
      id: verification._id,
      status: verification.status,
      provider: verification.provider,
      createdAt: verification.createdAt,
      updatedAt: verification.updatedAt,
      events: verification.events.map(e => ({
        status: e.status,
        timestamp: e.timestamp,
        details: e.details,
      })),
    },
  });
});

export const retryVerification = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = retryVerificationSchema.parse(req.body);

  const verification = await identityService.retryVerification(req.user!.id, validatedData);

  const mockData = await identityService.getMockVerificationData();

  return ApiResponse.success(
    res,
    {
      verification: {
        id: verification._id,
        status: verification.status,
        provider: verification.provider,
        sessionId: verification.providerSessionId,
      },
      sessionUrl: validatedData.provider === 'mock' ? mockData.sessionUrl : null,
    },
    'Verification retry initiated successfully'
  );
});

export const getVerificationStats = asyncHandler(async (req: Request, res: Response) => {
  // Admin only
  if (req.user!.role !== 'ADMIN') {
    return ApiResponse.error(
      res,
      'Only admins can view verification statistics',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const stats = await identityService.getVerificationStats();

  return ApiResponse.success(res, {
    stats,
  });
});
