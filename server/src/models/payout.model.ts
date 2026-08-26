import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPayout extends Document {
  dealerId: Types.ObjectId;
  amount: number;
  status: string;
  razorpayPayoutId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const payoutSchema = new Schema<IPayout>(
  {
    dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer', required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'PENDING' },
    razorpayPayoutId: { type: String },
  },
  { timestamps: true }
);

payoutSchema.index({ dealerId: 1 });
payoutSchema.index({ status: 1 });

export const Payout = mongoose.model<IPayout>('Payout', payoutSchema);
