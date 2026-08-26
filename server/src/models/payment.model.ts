import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  bookingId: Types.ObjectId;
  amount: number;
  currency: string;
  paymentStatus: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  paymentMethod?: 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET' | 'CASH';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'PENDING',
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'CARD', 'NET_BANKING', 'WALLET', 'CASH'],
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    refundAmount: { type: Number },
    refundReason: { type: String },
    refundedAt: { type: Date },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
