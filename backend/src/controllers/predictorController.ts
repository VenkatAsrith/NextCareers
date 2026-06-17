import { Request, Response } from 'express';
import Cutoff from '../models/Cutoff';
import College from '../models/College';
import Branch from '../models/Branch';
import Analytics from '../models/Analytics';

// Helper to map UI category to DB categories (e.g., SC -> SC_I, SC_II, SC_III)
const mapCategory = (cat: string): string[] => {
  const clean = (cat || '').trim().toUpperCase().replace('-', '_');
  if (clean === 'SC') {
    return ['SC_I', 'SC_II', 'SC_III'];
  }
  return [clean];
};

// POST /predict
export const predictColleges = async (req: Request, res: Response) => {
  try {
    const { rank, category, gender } = req.body;

    if (!rank || !category || !gender) {
      return res.status(400).json({ message: 'Rank, category, and gender are required' });
    }

    const userRank = Number(rank);
    const userCategories = mapCategory(category);
    const userGender = (gender || '').trim().toUpperCase();

    // Map genders
    // Male -> BOYS
    // Female -> GIRLS (Also eligible for BOYS seats)
    const genderQuery = userGender === 'FEMALE' ? ['BOYS', 'GIRLS'] : ['BOYS'];

    // 1. Fetch all colleges and branches into memory for fast indexing
    const colleges = await College.find();
    const collegeMap = new Map(colleges.map(c => [c.collegeCode, c]));

    const branches = await Branch.find();
    const branchMap = new Map(branches.map(b => [b.branchCode, b]));

    // 2. Query cutoffs matching categories and gender query
    const cutoffs = await Cutoff.find({
      category: { $in: userCategories },
      gender: { $in: genderQuery }
    });

    // 3. For females, a college + branch combination can match both BOYS and GIRLS.
    // We group by (collegeCode, branchCode) and keep the highest cutoff rank (the best chance).
    const groupedCutoffs = new Map<string, any>();

    cutoffs.forEach((cutoff) => {
      const key = `${cutoff.collegeCode}_${cutoff.branchCode}`;
      const cutoffRank = cutoff.rank2025 > 0 ? cutoff.rank2025 : cutoff.weightedRank;
      
      if (cutoffRank <= 0) return; // Skip invalid rankings

      const existing = groupedCutoffs.get(key);
      if (!existing) {
        groupedCutoffs.set(key, { cutoff, cutoffRank });
      } else {
        // Take the larger rank (easier cutoff)
        if (cutoffRank > existing.cutoffRank) {
          groupedCutoffs.set(key, { cutoff, cutoffRank });
        }
      }
    });

    const dream: any[] = [];
    const target: any[] = [];
    const safe: any[] = [];

    // 4. Classify each matched cutoff record
    groupedCutoffs.forEach(({ cutoff, cutoffRank }) => {
      const college = collegeMap.get(cutoff.collegeCode);
      if (!college) return; // Skip cutoffs for missing colleges

      const branch = branchMap.get(cutoff.branchCode);
      const branchName = branch ? branch.branchName : cutoff.branchCode;

      // Admission Probability Formula
      const ratio = cutoffRank / userRank;
      let probability = 0;

      if (ratio >= 1.25) {
        probability = Math.min(99, Math.round(85 + (ratio - 1.25) * 15));
      } else if (ratio >= 1.0) {
        probability = Math.round(50 + ((ratio - 1.0) / 0.25) * 34);
      } else if (ratio >= 0.7) {
        probability = Math.round(10 + ((ratio - 0.7) / 0.3) * 39);
      } else {
        probability = Math.max(1, Math.round((ratio / 0.7) * 9));
      }

      const collegeCard = {
        collegeCode: college.collegeCode,
        collegeName: college.collegeName,
        district: college.district,
        place: college.place,
        coed: college.coed,
        type: college.type,
        tuitionFee: college.tuitionFee,
        autonomous: college.autonomous,
        website: college.website,
        placementPercentage: college.placementPercentage,
        averagePackage: college.averagePackage,
        highestPackage: college.highestPackage,
        branchCode: cutoff.branchCode,
        branchName: branchName,
        cutoffRank2025: cutoff.rank2025,
        cutoffRank2024: cutoff.rank2024,
        cutoffRank2023: cutoff.rank2023,
        averageCutoffRank: cutoff.averageRank,
        trend: cutoff.trend,
        probability,
        categoryMatched: cutoff.category,
        genderMatched: cutoff.gender
      };

      // Classification based on EAPCET rules
      // Dream: cutoff is slightly harder than user rank (ratio between 0.7 and 1.0)
      // Target: cutoff is close to or slightly easier than user rank (ratio between 1.0 and 1.25)
      // Safe: cutoff is much easier than user rank (ratio > 1.25)
      if (ratio >= 0.7 && ratio < 1.0) {
        dream.push(collegeCard);
      } else if (ratio >= 1.0 && ratio <= 1.25) {
        target.push(collegeCard);
      } else if (ratio > 1.25) {
        safe.push(collegeCard);
      }
    });

    // Sort outputs by probability descending (best match first)
    const sortByProb = (a: any, b: any) => b.probability - a.probability;
    dream.sort(sortByProb);
    target.sort(sortByProb);
    safe.sort(sortByProb);

    // Save search analytics asynchronously
    Analytics.create({
      actionType: 'search',
      metadata: { rank: userRank, category, gender }
    }).catch(err => console.error('Failed to log search analytics:', err));

    res.json({
      dream,
      target,
      safe
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
