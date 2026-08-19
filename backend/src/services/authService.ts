import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/database';
import { RegisterInput, LoginInput, AuthResponse, SafeUser, JwtPayload } from '../types';
import { ConflictError, UnauthorizedError, ValidationError } from '../middleware/errorHandler';

class AuthService {
  private sanitizeUser(user: any): SafeUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      storageLimit: user.storageLimit,
      storageUsed: user.storageUsed,
      onboardingCompleted: user.onboardingCompleted ?? false,
      onboardingCompletedAt: user.onboardingCompletedAt ?? null,
      isFirstLogin: user.isFirstLogin ?? true,
      createdAt: user.createdAt,
    };
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(userId: string): string {
    return jwt.sign(
      { userId } as JwtPayload,
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRY as any }
    );
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId } as JwtPayload,
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRY as any }
    );
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    // Validate password strength
    if (input.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    const hashedPassword = await this.hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });

    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'register',
        resourceType: 'user',
        resourceId: user.id,
        details: 'Account created',
      },
    });

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await this.comparePassword(input.password, user.password);

    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
    };
  }

  async refreshToken(refreshTokenStr: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshTokenStr, env.JWT_REFRESH_SECRET) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const token = this.generateToken(user.id);
      const newRefreshToken = this.generateRefreshToken(user.id);

      return { token, refreshToken: newRefreshToken };
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return this.sanitizeUser(user);
  }
}

export default new AuthService();
