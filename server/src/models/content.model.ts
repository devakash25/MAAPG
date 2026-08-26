import mongoose, { Schema, Document } from 'mongoose';

export interface IHeroBanner extends Document {
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const heroBannerSchema = new Schema<IHeroBanner>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const faqSchema = new Schema<IFAQ>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const HeroBanner = mongoose.model<IHeroBanner>('HeroBanner', heroBannerSchema);
export const FAQ = mongoose.model<IFAQ>('FAQ', faqSchema);
