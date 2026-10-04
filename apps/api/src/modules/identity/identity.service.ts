import { IdentityVerification, IIdentityVerification } from './identity.model';
import { User } from '../users/user.model';
import {
  InitiateVerificationInput,
  InitiateVerificationWithDocumentInput,
  HandleVerificationCallbackInput,
  RetryVerificationInput,
} from './identity.validation';
import crypto from 'crypto';

export class IdentityVerificationService {
  async initiateVerification(
    userId: string,
    data: InitiateVerificationInput
  ): Promise<IIdentityVerification> {
    const existingVerification = await IdentityVerification.findOne({ userId });

    if (existingVerification && existingVerification.status === 'VERIFIED') {
      throw new Error('User already verified');
    }

    if (existingVerification && existingVerification.status === 'PENDING') {
      throw new Error('Verification already in progress');
    }

    const sessionId = crypto.randomBytes(16).toString('hex');

    const verification = await IdentityVerification.findOneAndUpdate(
      { userId },
      {
        userId,
        provider: data.provider,
        providerSessionId: sessionId,
        status: 'PENDING',
        $push: {
          events: {
            status: 'INITIATED',
            timestamp: new Date(),
            details: `Verification initiated with provider: ${data.provider}`,
          },
        },
      },
      { upsert: true, new: true }
    );

    return verification!;
  }

  async initiateVerificationWithDocument(
    userId: string,
    data: InitiateVerificationWithDocumentInput
  ): Promise<IIdentityVerification> {
    const existingVerification = await IdentityVerification.findOne({ userId });

    if (existingVerification && existingVerification.status === 'VERIFIED') {
      throw new Error('User already verified');
    }

    if (existingVerification && existingVerification.status === 'PENDING') {
      throw new Error('Verification already in progress');
    }

    const sessionId = crypto.randomBytes(16).toString('hex');

    const verification = await IdentityVerification.findOneAndUpdate(
      { userId },
      {
        userId,
        provider: data.provider,
        providerSessionId: sessionId,
        status: 'PENDING',
        metadata: {
          documentType: data.documentType,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          documentFrontHash: this.hashDocument(data.documentFront),
          documentBackHash: data.documentBack ? this.hashDocument(data.documentBack) : null,
          selfieImageHash: this.hashDocument(data.selfieImage),
        },
        $push: {
          events: {
            status: 'DOCUMENT_SUBMITTED',
            timestamp: new Date(),
            details: `Document verification initiated: ${data.documentType}`,
          },
        },
      },
      { upsert: true, new: true }
    );

    return verification!;
  }

  async handleVerificationCallback(
    sessionId: string,
    data: HandleVerificationCallbackInput
  ): Promise<IIdentityVerification> {
    const verification = await IdentityVerification.findOne({
      providerSessionId: sessionId,
    });

    if (!verification) {
      throw new Error('Verification session not found');
    }

    verification.status = data.status as any;
    if (data.metadata) {
      verification.metadata = {
        ...verification.metadata,
        ...data.metadata,
      };
    }

    verification.events.push({
      status: data.status,
      timestamp: new Date(),
      details: `Callback received from provider with status: ${data.status}`,
    });

    await verification.save();

    // Update user verified status if successful
    if (data.status === 'VERIFIED') {
      await User.findByIdAndUpdate(verification.userId, {
        verified: true,
      });
    }

    return verification;
  }

  async getVerificationStatus(userId: string): Promise<IIdentityVerification | null> {
    return IdentityVerification.findOne({ userId });
  }

  async retryVerification(
    userId: string,
    data: RetryVerificationInput
  ): Promise<IIdentityVerification> {
    const verification = await IdentityVerification.findOne({ userId });

    if (!verification) {
      throw new Error('No verification record found');
    }

    if (verification.status === 'VERIFIED') {
      throw new Error('User already verified');
    }

    const sessionId = crypto.randomBytes(16).toString('hex');

    verification.provider = data.provider;
    verification.providerSessionId = sessionId;
    verification.status = 'PENDING';
    verification.events.push({
      status: 'RETRY_INITIATED',
      timestamp: new Date(),
      details: `Verification retry initiated with provider: ${data.provider}`,
    });

    await verification.save();

    return verification;
  }

  async expireVerification(userId: string): Promise<IIdentityVerification | null> {
    const verification = await IdentityVerification.findOne({ userId });

    if (!verification) {
      return null;
    }

    if (verification.status !== 'PENDING') {
      return verification;
    }

    verification.status = 'EXPIRED';
    verification.events.push({
      status: 'EXPIRED',
      timestamp: new Date(),
      details: 'Verification session expired',
    });

    await verification.save();

    return verification;
  }

  async getMockVerificationData(): Promise<{ sessionUrl: string; sessionId: string }> {
    const sessionId = crypto.randomBytes(16).toString('hex');
    return {
      sessionId,
      sessionUrl: `http://localhost:5000/api/v1/identity/mock-verify/${sessionId}`,
    };
  }

  async getVerificationStats(): Promise<{
    total: number;
    verified: number;
    pending: number;
    failed: number;
    reviewRequired: number;
    expired: number;
  }> {
    const stats = await IdentityVerification.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      verified: 0,
      pending: 0,
      failed: 0,
      reviewRequired: 0,
      expired: 0,
    };

    for (const stat of stats) {
      result[stat._id.toLowerCase() as keyof typeof result] = stat.count;
      result.total += stat.count;
    }

    return result;
  }

  private hashDocument(documentData: string): string {
    return crypto.createHash('sha256').update(documentData).digest('hex');
  }
}
