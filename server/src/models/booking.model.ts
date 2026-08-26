import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBooking extends Document {
  userId: Types.ObjectId;
  propertyId: Types.ObjectId;
  roomId?: Types.ObjectId;
  bedId?: Types.ObjectId;
  bookingStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'FAILED';
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalAmount: number;
  platformCommission: number;
  dealerAmount: number;
  specialRequests?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    bedId: { type: Schema.Types.ObjectId },
    bookingStatus: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, default: 1 },
    totalAmount: { type: Number, required: true },
    platformCommission: { type: Number, default: 0 },
    dealerAmount: { type: Number, default: 0 },
    specialRequests: { type: String },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

bookingSchema.index({ userId: 1 });
bookingSchema.index({ propertyId: 1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ createdAt: 1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
