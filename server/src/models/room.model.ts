import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRoomImage {
  url: string;
  alt?: string;
}

export interface IBed {
  name: string;
  isAvailable: boolean;
}

export interface IRoomAvailability {
  date: Date;
  totalBeds: number;
  available: number;
  isBlocked: boolean;
}

export interface IRoomPrice {
  date: Date;
  price: number;
}

export interface IRoom extends Document {
  propertyId: Types.ObjectId;
  name: string;
  description?: string;
  roomType?: string;
  capacity: number;
  bedType?: string;
  pricePerNight?: number;
  pricePerMonth?: number;
  deposit?: number;
  isAC: boolean;
  hasAttachedBathroom: boolean;
  isFurnished: boolean;
  isActive: boolean;
  totalBeds: number;
  availableBeds: number;
  beds: IBed[];
  images: IRoomImage[];
  availability: IRoomAvailability[];
  prices: IRoomPrice[];
  createdAt: Date;
  updatedAt: Date;
}

const bedSchema = new Schema<IBed>({
  name: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
});

const roomImageSchema = new Schema<IRoomImage>({
  url: { type: String, required: true },
  alt: { type: String },
});

const roomAvailabilitySchema = new Schema<IRoomAvailability>({
  date: { type: Date, required: true },
  totalBeds: { type: Number, required: true },
  available: { type: Number, required: true },
  isBlocked: { type: Boolean, default: false },
});

const roomPriceSchema = new Schema<IRoomPrice>({
  date: { type: Date, required: true },
  price: { type: Number, required: true },
});

const roomSchema = new Schema<IRoom>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    name: { type: String, required: true },
    description: { type: String },
    roomType: { type: String },
    capacity: { type: Number, default: 1 },
    bedType: { type: String },
    pricePerNight: { type: Number },
    pricePerMonth: { type: Number },
    deposit: { type: Number },
    isAC: { type: Boolean, default: false },
    hasAttachedBathroom: { type: Boolean, default: false },
    isFurnished: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    totalBeds: { type: Number, default: 1 },
    availableBeds: { type: Number, default: 1 },
    beds: { type: [bedSchema], default: [] },
    images: { type: [roomImageSchema], default: [] },
    availability: { type: [roomAvailabilitySchema], default: [] },
    prices: { type: [roomPriceSchema], default: [] },
  },
  { timestamps: true }
);

roomSchema.index({ propertyId: 1 });

export const Room = mongoose.model<IRoom>('Room', roomSchema);
