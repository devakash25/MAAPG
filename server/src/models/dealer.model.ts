import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDealerDocument {
  type: string;
  url: string;
  fileName: string;
  verified: boolean;
  createdAt: Date;
}

export interface IDealer extends Document {
  userId: Types.ObjectId;
  businessName: string;
  businessType?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  gstNumber?: string;
  panNumber?: string;
  aadharNumber?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankName?: string;
  businessTypes: string[];
  city?: string;
  state?: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'BLOCKED';
  verificationLevel: 'UNVERIFIED' | 'BASIC_VERIFIED' | 'OWNER_VERIFIED' | 'PROPERTY_VERIFIED' | 'PREMIUM_VERIFIED';
  commissionRate?: number;
  totalRevenue: number;
  totalProperties: number;
  totalBookings: number;
  rating?: number;
  totalReviews: number;
  isFeatured: boolean;
  documents: IDealerDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const dealerDocumentSchema = new Schema<IDealerDocument>({
  type: { type: String, required: true },
  url: { type: String, required: true },
  fileName: { type: String, required: true },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const dealerSchema = new Schema<IDealer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true },
    businessType: { type: String },
    businessEmail: { type: String },
    businessPhone: { type: String },
    businessAddress: { type: String },
    gstNumber: { type: String },
    panNumber: { type: String },
    aadharNumber: { type: String },
    bankAccountNumber: { type: String },
    bankIfscCode: { type: String },
    bankName: { type: String },
    businessTypes: { type: [String], default: [] },
    city: { type: String },
    state: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'BLOCKED'],
      default: 'PENDING',
    },
    verificationLevel: {
      type: String,
      enum: ['UNVERIFIED', 'BASIC_VERIFIED', 'OWNER_VERIFIED', 'PROPERTY_VERIFIED', 'PREMIUM_VERIFIED'],
      default: 'UNVERIFIED',
    },
    commissionRate: { type: Number },
    totalRevenue: { type: Number, default: 0 },
    totalProperties: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    rating: { type: Number },
    totalReviews: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    documents: { type: [dealerDocumentSchema], default: [] },
  },
  { timestamps: true }
);

dealerSchema.index({ status: 1 });
dealerSchema.index({ userId: 1 });

export const Dealer = mongoose.model<IDealer>('Dealer', dealerSchema);
