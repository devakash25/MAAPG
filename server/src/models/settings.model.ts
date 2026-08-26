import mongoose, { Schema, Document } from 'mongoose';

export interface IPlatformSettings extends Document {
  key: string;
  value: string;
  description?: string;
  updatedAt: Date;
}

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

platformSettingsSchema.index({ key: 1 });

export const PlatformSettings = mongoose.model<IPlatformSettings>('PlatformSettings', platformSettingsSchema);
