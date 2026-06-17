import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
  branchCode: string;
  branchName: string;
  stream: string;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema: Schema = new Schema(
  {
    branchCode: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    branchName: { type: String, required: true, trim: true },
    stream: { type: String, default: 'EAPCET', uppercase: true, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model<IBranch>('Branch', BranchSchema);
