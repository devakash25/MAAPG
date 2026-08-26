import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  description?: string;
  discountType: string;
  discount: number;
  minAmount?: number;
  maxDiscount?: number;
  maxUses?: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    discountType: { type: String, default: 'PERCENTAGE' },
    discount: { type: Number, required: true },
    minAmount: { type: Number },
    maxDiscount: { type: Number },
    maxUses: { type: Number },
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1 });

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);
