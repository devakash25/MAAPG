import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Dealer } from '../../models';
import { env } from '../../config/environment';
import { ApiError } from '../../utils/apiError';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
    businessTypes?: string[];
    businessName?: string;
  }) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    if (data.phone) {
      const existingPhone = await User.findOne({ phone: data.phone });
      if (existingPhone) {
        throw ApiError.conflict('Phone number already registered');
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await User.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: (data.role || 'CUSTOMER') as any,
    });

    if (data.role === 'DEALER') {
      await Dealer.create({
        userId: user._id,
        businessName: data.businessName || `${data.firstName} ${data.lastName}'s Business`,
        businessTypes: data.businessTypes || [],
        status: 'PENDING',
      });
    }

    const tokens = this.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  static async login(email: string, password: string) {
    const user = await User.findOne({ email }).lean();

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    const dealer = await Dealer.findOne({ userId: user._id }).lean();

    const tokens = this.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        dealer: dealer ? { id: dealer._id, status: dealer.status, businessTypes: dealer.businessTypes } : null,
      },
      ...tokens,
    };
  }

  static async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;

      const user = await User.findById(decoded.userId).select('email role isActive').lean();

      if (!user || !user.isActive) {
        throw ApiError.unauthorized('Invalid refresh token');
      }

      const tokens = this.generateTokens({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      return tokens;
    } catch (error) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
  }

  static async getMe(userId: string) {
    const user = await User.findById(userId)
      .select('-passwordHash')
      .lean();

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const dealer = await Dealer.findOne({ userId: user._id }).lean();

    return {
      ...user,
      dealer: dealer ? {
        id: dealer._id,
        businessName: dealer.businessName,
        status: dealer.status,
        businessTypes: dealer.businessTypes,
        totalRevenue: dealer.totalRevenue,
        totalProperties: dealer.totalProperties,
        totalBookings: dealer.totalBookings,
        rating: dealer.rating,
      } : null,
    };
  }

  private static generateTokens(payload: TokenPayload) {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRY as any,
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY as any,
    });

    return { accessToken, refreshToken };
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) throw ApiError.unauthorized('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(userId, { passwordHash });

    return { message: 'Password changed successfully' };
  }
}

export default AuthService;
