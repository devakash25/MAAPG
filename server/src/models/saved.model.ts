import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISavedSearch extends Document {
  userId: Types.ObjectId;
  name: string;
  query: string;
  city?: string;
  propertyType?: string;
  priceMin?: number;
  priceMax?: number;
  amenities: string[];
  alertEnabled: boolean;
  createdAt: Date;
}

export interface ISavedLocation extends Document {
  userId: Types.ObjectId;
  label: string;
  address: string;
  city: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  icon?: string;
  createdAt: Date;
}

const savedSearchSchema = new Schema<ISavedSearch>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    query: { type: String, required: true },
    city: { type: String },
    propertyType: { type: String },
    priceMin: { type: Number },
    priceMax: { type: Number },
    amenities: { type: [String], default: [] },
    alertEnabled: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

savedSearchSchema.index({ userId: 1 });

const savedLocationSchema = new Schema<ISavedLocation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    area: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    icon: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

savedLocationSchema.index({ userId: 1 });

export const SavedSearch = mongoose.model<ISavedSearch>('SavedSearch', savedSearchSchema);
export const SavedLocation = mongoose.model<ISavedLocation>('SavedLocation', savedLocationSchema);
