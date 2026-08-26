import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEnquiry extends Document {
  userId: Types.ObjectId;
  propertyId: Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  moveInDate?: Date;
  budget?: number;
  duration?: string;
  status: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'CONVERTED' | 'CLOSED' | 'LOST';
  dealerNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const enquirySchema = new Schema<IEnquiry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    message: { type: String },
    moveInDate: { type: Date },
    budget: { type: Number },
    duration: { type: String },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'CLOSED', 'LOST'],
      default: 'NEW',
    },
    dealerNotes: { type: String },
  },
  { timestamps: true }
);

enquirySchema.index({ propertyId: 1 });
enquirySchema.index({ userId: 1 });
enquirySchema.index({ status: 1 });

export const Enquiry = mongoose.model<IEnquiry>('Enquiry', enquirySchema);
