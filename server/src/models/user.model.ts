import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  phone?: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'SUPER_ADMIN' | 'DEALER' | 'CUSTOMER';
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    avatar: { type: String },
    role: { type: String, enum: ['SUPER_ADMIN', 'DEALER', 'CUSTOMER'], default: 'CUSTOMER' },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
