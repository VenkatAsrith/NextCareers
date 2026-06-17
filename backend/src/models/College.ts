import mongoose, { Schema, Document } from 'mongoose';

export interface ICollege extends Document {
  collegeCode: string;
  collegeName: string;
  district: string;
  place: string;
  coed: 'COED' | 'GIRLS';
  type: string;
  tuitionFee: number;
  autonomous: boolean;
  website: string;
  placementPercentage: number;
  averagePackage: number;
  highestPackage: number;
  createdAt: Date;
  updatedAt: Date;
}

const CollegeSchema: Schema = new Schema(
  {
    collegeCode: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    collegeName: { type: String, required: true, trim: true },
    district: { type: String, required: true, uppercase: true, trim: true },
    place: { type: String, trim: true },
    coed: { type: String, required: true, enum: ['COED', 'GIRLS'], default: 'COED' },
    type: { type: String, trim: true },
    tuitionFee: { type: Number, required: true, default: 0 },
    autonomous: { type: Boolean, required: true, default: false },
    website: { type: String, default: '' },
    // Placement details (enriched during data loading)
    placementPercentage: { type: Number, default: 0 },
    averagePackage: { type: Number, default: 0 }, // in Lakhs Per Annum (LPA)
    highestPackage: { type: Number, default: 0 }  // in Lakhs Per Annum (LPA)
  },
  { timestamps: true }
);

export default mongoose.model<ICollege>('College', CollegeSchema);
