import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBed extends Document {
  roomId: Types.ObjectId;
  name: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bedSchema = new Schema<IBed>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    name: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

bedSchema.index({ roomId: 1 });

export const Bed = mongoose.model<IBed>('Bed', bedSchema);
