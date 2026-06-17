import mongoose, { Schema, Document } from 'mongoose';

export interface ICutoff extends Document {
  collegeCode: string;
  branchCode: string;
  category: string;
  gender: 'BOYS' | 'GIRLS';
  rank2023: number;
  rank2024: number;
  rank2025: number;
  averageRank: number;
  weightedRank: number;
  trend: number;
  createdAt: Date;
  updatedAt: Date;
}

const CutoffSchema: Schema = new Schema(
  {
    collegeCode: { type: String, required: true, uppercase: true, trim: true },
    branchCode: { type: String, required: true, uppercase: true, trim: true },
    category: { type: String, required: true, uppercase: true, trim: true },
    gender: { type: String, required: true, enum: ['BOYS', 'GIRLS'] },
    rank2023: { type: Number, default: 0 },
    rank2024: { type: Number, default: 0 },
    rank2025: { type: Number, default: 0 },
    averageRank: { type: Number, default: 0 },
    weightedRank: { type: Number, default: 0 },
    trend: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Optimize query performance with indexes for predictability analysis
CutoffSchema.index({ category: 1, gender: 1 });
CutoffSchema.index({ collegeCode: 1, branchCode: 1 });
CutoffSchema.index({ collegeCode: 1, branchCode: 1, category: 1, gender: 1 });

export default mongoose.model<ICutoff>('Cutoff', CutoffSchema);
