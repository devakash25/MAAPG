import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage {
  senderId: Types.ObjectId;
  content: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface IConversation extends Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  propertyId?: Types.ObjectId;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    imageUrl: { type: String },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const conversationSchema = new Schema<IConversation>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
