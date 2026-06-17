import mongoose, { Schema, Document } from 'mongoose';

export interface IWishlist extends Document {
  userId: mongoose.Types.ObjectId;
  collegeCode: string;
  branchCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const WishlistSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    collegeCode: { type: String, required: true, uppercase: true, trim: true },
    branchCode: { type: String, required: true, uppercase: true, trim: true }
  },
  { timestamps: true }
);

// Prevent duplicate wishlist entries for a user
WishlistSchema.index({ userId: 1, collegeCode: 1, branchCode: 1 }, { unique: true });

export default mongoose.model<IWishlist>('Wishlist', WishlistSchema);
