import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReport extends Document {
  userId: Types.ObjectId;
  propertyId?: Types.ObjectId;
  dealerId?: Types.ObjectId;
  type: 'FAKE_PROPERTY' | 'FAKE_DEALER' | 'WRONG_PRICE' | 'SCAM' | 'MISLEADING_PHOTOS' | 'BAD_EXPERIENCE' | 'DUPLICATE_LISTING' | 'OTHER';
  description: string;
  status: 'NEW' | 'INVESTIGATING' | 'ACTION_TAKEN' | 'CLOSED';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer' },
    type: {
      type: String,
      enum: ['FAKE_PROPERTY', 'FAKE_DEALER', 'WRONG_PRICE', 'SCAM', 'MISLEADING_PHOTOS', 'BAD_EXPERIENCE', 'DUPLICATE_LISTING', 'OTHER'],
      required: true,
    },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['NEW', 'INVESTIGATING', 'ACTION_TAKEN', 'CLOSED'],
      default: 'NEW',
    },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

reportSchema.index({ type: 1 });
reportSchema.index({ status: 1 });

export const Report = mongoose.model<IReport>('Report', reportSchema);
