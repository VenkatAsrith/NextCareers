import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  rank: number;
  category: string;
  gender: 'BOYS' | 'GIRLS';
  district: string;
  interestedBranches: string[];
  mobile?: string;
  email?: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    rank: { type: Number, required: true },
    category: { 
      type: String, 
      required: true, 
      enum: ['OC', 'EWS', 'BC_A', 'BC_B', 'BC_C', 'BC_D', 'BC_E', 'SC_I', 'SC_II', 'SC_III', 'ST'] 
    },
    gender: { type: String, required: true, enum: ['BOYS', 'GIRLS'] },
    district: { type: String, required: true, trim: true },
    interestedBranches: [{ type: String, trim: true }],
    mobile: { type: String, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model<IStudent>('Student', StudentSchema);
