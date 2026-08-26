import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComplaint extends Document {
  userId: Types.ObjectId;
  propertyId?: Types.ObjectId;
  bookingId?: Types.ObjectId;
  subject: string;
  description: string;
  category?: string;
  status: 'NEW' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  adminNotes?: string;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

const complaintSchema = new Schema<IComplaint>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String },
    status: {
      type: String,
      enum: ['NEW', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'CLOSED'],
      default: 'NEW',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    adminNotes: { type: String },
    resolution: { type: String },
  },
  { timestamps: true }
);

complaintSchema.index({ status: 1 });
complaintSchema.index({ priority: 1 });

export const Complaint = mongoose.model<IComplaint>('Complaint', complaintSchema);
