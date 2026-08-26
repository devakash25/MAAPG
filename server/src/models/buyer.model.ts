import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBuyerProfile extends Document {
  userId: Types.ObjectId;
  preferredCity?: string;
  preferredBudgetMin?: number;
  preferredBudgetMax?: number;
  preferredPropertyTypes: string[];
  preferredRoomType?: string;
  preferredAmenities: string[];
  foodPreference?: string;
  stayDuration?: string;
  createdAt: Date;
  updatedAt: Date;
}

const buyerProfileSchema = new Schema<IBuyerProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    preferredCity: { type: String },
    preferredBudgetMin: { type: Number },
    preferredBudgetMax: { type: Number },
    preferredPropertyTypes: { type: [String], default: [] },
    preferredRoomType: { type: String },
    preferredAmenities: { type: [String], default: [] },
    foodPreference: { type: String },
    stayDuration: { type: String },
  },
  { timestamps: true }
);

buyerProfileSchema.index({ userId: 1 });

export const BuyerProfile = mongoose.model<IBuyerProfile>('BuyerProfile', buyerProfileSchema);
