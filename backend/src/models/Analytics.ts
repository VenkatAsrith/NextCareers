import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalytics extends Document {
  userId?: mongoose.Types.ObjectId;
  actionType: 'search' | 'view_college' | 'add_wishlist' | 'save_board';
  metadata: Record<string, any>;
  createdAt: Date;
}

const AnalyticsSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    actionType: { 
      type: String, 
      required: true, 
      enum: ['search', 'view_college', 'add_wishlist', 'save_board'] 
    },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { 
    timestamps: { createdAt: true, updatedAt: false } 
  }
);

export default mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);
