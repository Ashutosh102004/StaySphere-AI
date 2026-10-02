import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../users/user.model';
import { config } from '@/config/env';
import { RegisterInput, LoginInput } from './auth.validation';

export class AuthService {
  async register(data: RegisterInput): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await User.create({
      email: data.email,
      passwordHash,
      role: 'GUEST',
      emailVerified: false,
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: user.toObject() as IUser,
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginInput): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const user = await User.findOne({ email: data.email }).select('+passwordHash');
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    const userObject = user.toObject() as IUser;
    delete (userObject as any).passwordHash;

    return {
      user: userObject,
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new Error('User not found');
      }

      const accessToken = this.generateAccessToken(user);
      return { accessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async verifyToken(token: string): Promise<{ userId: string; email: string; role: string }> {
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret) as {
        userId: string;
        email: string;
        role: string;
      };
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  private generateAccessToken(user: IUser): string {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const secret = config.jwt.accessSecret;
    const options = {
      expiresIn: config.jwt.accessExpiration,
    } as jwt.SignOptions;

    return jwt.sign(payload, secret, options);
  }

  private generateRefreshToken(user: IUser): string {
    const payload = {
      userId: user._id.toString(),
    };
    const secret = config.jwt.refreshSecret;
    const options = {
      expiresIn: config.jwt.refreshExpiration,
    } as jwt.SignOptions;

    return jwt.sign(payload, secret, options);
  }
}
