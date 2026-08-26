import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
  country: string;
  state: string;
  city: string;
  area?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}

const locationSchema = new Schema<ILocation>(
  {
    country: { type: String, default: 'India' },
    state: { type: String, required: true },
    city: { type: String, required: true },
    area: { type: String },
    pincode: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { timestamps: false }
);

locationSchema.index({ state: 1, city: 1, area: 1 }, { unique: true });
locationSchema.index({ city: 1 });
locationSchema.index({ state: 1 });

export const Location = mongoose.model<ILocation>('Location', locationSchema);
