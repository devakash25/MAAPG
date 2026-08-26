import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPropertyAmenity {
  name: string;
  icon?: string;
  category?: string;
}

export interface IPropertyImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
  order: number;
}

export interface IPropertyRule {
  rule: string;
}

export interface IProperty extends Document {
  dealerId: Types.ObjectId;
  propertyType: 'HOTEL' | 'HOSTEL' | 'PG' | 'RENTAL_ROOM' | 'APARTMENT' | 'GUEST_HOUSE';
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  contactPhone: string;
  contactEmail?: string;
  status: 'DRAFT' | 'PENDING_VERIFICATION' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | 'UNPUBLISHED';
  verificationLevel: 'UNVERIFIED' | 'BASIC_VERIFIED' | 'OWNER_VERIFIED' | 'PROPERTY_VERIFIED' | 'PREMIUM_VERIFIED';
  isActive: boolean;
  isFeatured: boolean;
  rating?: number;
  totalReviews: number;
  totalBookings: number;
  totalRevenue: number;
  commissionRate?: number;
  amenities: IPropertyAmenity[];
  images: IPropertyImage[];
  rules: IPropertyRule[];
  createdAt: Date;
  updatedAt: Date;
}

const propertyAmenitySchema = new Schema<IPropertyAmenity>({
  name: { type: String, required: true },
  icon: { type: String },
  category: { type: String },
});

const propertyImageSchema = new Schema<IPropertyImage>({
  url: { type: String, required: true },
  alt: { type: String },
  isPrimary: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
});

const propertyRuleSchema = new Schema<IPropertyRule>({
  rule: { type: String, required: true },
});

const propertySchema = new Schema<IProperty>(
  {
    dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer', required: true },
    propertyType: {
      type: String,
      enum: ['HOTEL', 'HOSTEL', 'PG', 'RENTAL_ROOM', 'APARTMENT', 'GUEST_HOUSE'],
      required: true,
    },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
    latitude: { type: Number },
    longitude: { type: Number },
    contactPhone: { type: String, required: true },
    contactEmail: { type: String },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_VERIFICATION', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'UNPUBLISHED'],
      default: 'DRAFT',
    },
    verificationLevel: {
      type: String,
      enum: ['UNVERIFIED', 'BASIC_VERIFIED', 'OWNER_VERIFIED', 'PROPERTY_VERIFIED', 'PREMIUM_VERIFIED'],
      default: 'UNVERIFIED',
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    rating: { type: Number },
    totalReviews: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    commissionRate: { type: Number },
    amenities: { type: [propertyAmenitySchema], default: [] },
    images: { type: [propertyImageSchema], default: [] },
    rules: { type: [propertyRuleSchema], default: [] },
  },
  { timestamps: true }
);

propertySchema.index({ dealerId: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ city: 1, status: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ slug: 1 });

export const Property = mongoose.model<IProperty>('Property', propertySchema);
