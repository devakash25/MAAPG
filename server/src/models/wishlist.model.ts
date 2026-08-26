import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWishlist extends Document {
  userId: Types.ObjectId;
  propertyId: Types.ObjectId;
  collectionId?: Types.ObjectId;
  createdAt: Date;
}

export interface IWishlistCollection extends Document {
  userId: Types.ObjectId;
  name: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWishlistCollectionItem extends Document {
  collectionId: Types.ObjectId;
  propertyId: Types.ObjectId;
  createdAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    collectionId: { type: Schema.Types.ObjectId, ref: 'WishlistCollection' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

wishlistSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

const wishlistCollectionSchema = new Schema<IWishlistCollection>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    icon: { type: String },
  },
  { timestamps: true }
);

wishlistCollectionSchema.index({ userId: 1, name: 1 }, { unique: true });

const wishlistCollectionItemSchema = new Schema<IWishlistCollectionItem>(
  {
    collectionId: { type: Schema.Types.ObjectId, ref: 'WishlistCollection', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

wishlistCollectionItemSchema.index({ collectionId: 1, propertyId: 1 }, { unique: true });

export const Wishlist = mongoose.model<IWishlist>('Wishlist', wishlistSchema);
export const WishlistCollection = mongoose.model<IWishlistCollection>('WishlistCollection', wishlistCollectionSchema);
export const WishlistCollectionItem = mongoose.model<IWishlistCollectionItem>('WishlistCollectionItem', wishlistCollectionItemSchema);
