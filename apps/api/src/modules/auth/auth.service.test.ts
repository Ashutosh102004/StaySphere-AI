import { AuthService } from '@/modules/auth/auth.service';
import { User } from '@/modules/users/user.model';
import { config } from '@/config/env';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('@/modules/users/user.model');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('@/config/env', () => ({
  config: {
    jwt: {
      accessSecret: 'test-access-secret-min-32-characters-long',
      refreshSecret: 'test-refresh-secret-min-32-characters-long',
      accessExpiration: '15m',
      refreshExpiration: '7d',
    },
  },
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register()', () => {
    it('should successfully register a new user with valid credentials', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockUser = {
        _id: { toString: () => 'user-123' },
        email: 'test@example.com',
        role: 'GUEST',
        emailVerified: false,
        toObject: jest.fn().mockReturnValue({
          _id: 'user-123',
          email: 'test@example.com',
          role: 'GUEST',
          emailVerified: false,
        }),
      };

      // Mock User.findOne to return null (email doesn't exist)
      (User.findOne as jest.Mock).mockResolvedValue(null);

      // Mock bcrypt.hash
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      // Mock User.create
      (User.create as jest.Mock).mockResolvedValue(mockUser);

      // Mock jwt.sign
      (jwt.sign as jest.Mock).mockReturnValue('mocked-token');

      const result = await authService.register(registerData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 12);
      expect(User.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'GUEST',
        emailVerified: false,
      });
    });

    it('should reject registration with duplicate email', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'Password123',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      const existingUser = {
        _id: { toString: () => 'user-456' },
        email: 'existing@example.com',
      };

      (User.findOne as jest.Mock).mockResolvedValue(existingUser);

      await expect(authService.register(registerData)).rejects.toThrow(
        'Email already registered'
      );

      expect(User.findOne).toHaveBeenCalledWith({ email: 'existing@example.com' });
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('login()', () => {
    it('should successfully login with valid credentials', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'Password123',
      };

      const mockUser = {
        _id: { toString: () => 'user-123' },
        email: 'user@example.com',
        role: 'GUEST',
        comparePassword: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: 'user-123',
          email: 'user@example.com',
          role: 'GUEST',
          emailVerified: false,
          passwordHash: 'should-be-deleted',
        }),
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      (jwt.sign as jest.Mock).mockReturnValue('mocked-token');

      const result = await authService.login(loginData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('user@example.com');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('Password123');
    });

    it('should reject login with nonexistent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123',
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(authService.login(loginData)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should reject login with incorrect password', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'WrongPassword123',
      };

      const mockUser = {
        _id: { toString: () => 'user-123' },
        email: 'user@example.com',
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await expect(authService.login(loginData)).rejects.toThrow(
        'Invalid email or password'
      );

      expect(mockUser.comparePassword).toHaveBeenCalledWith('WrongPassword123');
    });
  });

  describe('refreshAccessToken()', () => {
    it('should successfully refresh access token with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';

      const mockUser = {
        _id: { toString: () => 'user-123' },
        email: 'user@example.com',
        role: 'GUEST',
      };

      (jwt.verify as jest.Mock).mockReturnValue({
        userId: 'user-123',
      });

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      (jwt.sign as jest.Mock).mockReturnValue('new-access-token');

      const result = await authService.refreshAccessToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBe('new-access-token');
      expect(jwt.verify).toHaveBeenCalledWith(
        refreshToken,
        config.jwt.refreshSecret
      );
      expect(User.findById).toHaveBeenCalledWith('user-123');
    });

    it('should reject refresh with invalid token', async () => {
      const invalidToken = 'invalid-token';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshAccessToken(invalidToken)).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should reject refresh when user not found', async () => {
      const refreshToken = 'valid-refresh-token';

      (jwt.verify as jest.Mock).mockReturnValue({
        userId: 'nonexistent-user',
      });

      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow(
        'Invalid refresh token'
      );
    });
  });

  describe('verifyToken()', () => {
    it('should successfully verify valid token', async () => {
      const token = 'valid-access-token';

      const decoded = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'GUEST',
      };

      (jwt.verify as jest.Mock).mockReturnValue(decoded);

      const result = await authService.verifyToken(token);

      expect(result).toEqual(decoded);
      expect(jwt.verify).toHaveBeenCalledWith(token, config.jwt.accessSecret);
    });

    it('should reject verification with invalid token', async () => {
      const invalidToken = 'invalid-token';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.verifyToken(invalidToken)).rejects.toThrow(
        'Invalid token'
      );
    });

    it('should reject verification with expired token', async () => {
      const expiredToken = 'expired-token';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      await expect(authService.verifyToken(expiredToken)).rejects.toThrow(
        'Invalid token'
      );
    });
  });
});
