import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReview extends Document {
  userId: Types.ObjectId;
  propertyId: Types.ObjectId;
  bookingId: Types.ObjectId;
  rating: number;
  title?: string;
  comment?: string;
  photos: string[];
  ownerReply?: string;
  isVerified: boolean;
  isFlagged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    rating: { type: Number, required: true },
    title: { type: String },
    comment: { type: String },
    photos: { type: [String], default: [] },
    ownerReply: { type: String },
    isVerified: { type: Boolean, default: false },
    isFlagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ propertyId: 1 });
reviewSchema.index({ userId: 1 });

export const Review = mongoose.model<IReview>('Review', reviewSchema);
