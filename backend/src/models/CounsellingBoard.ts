import mongoose, { Schema, Document } from 'mongoose';

export interface ICounsellingOption {
  collegeCode: string;
  branchCode: string;
  priority: number;
}

export interface ICounsellingBoard extends Document {
  userId: mongoose.Types.ObjectId;
  options: ICounsellingOption[];
  createdAt: Date;
  updatedAt: Date;
}

const CounsellingBoardSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    options: [
      {
        collegeCode: { type: String, required: true, uppercase: true, trim: true },
        branchCode: { type: String, required: true, uppercase: true, trim: true },
        priority: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model<ICounsellingBoard>('CounsellingBoard', CounsellingBoardSchema);
