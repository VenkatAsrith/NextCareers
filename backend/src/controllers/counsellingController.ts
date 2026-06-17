import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import CounsellingBoard from '../models/CounsellingBoard';
import Student from '../models/Student';
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

// GET /counselling
export const getCounsellingBoard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    // Fetch Student profile
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ 
        message: 'Student profile not found. Please complete your academic profile first.' 
      });
    }

    // Fetch Counselling Board
    let board = await CounsellingBoard.findOne({ userId });
    if (!board) {
      board = await CounsellingBoard.create({ userId, options: [] });
    }

    // Prepare lists of codes for bulk queries
    const optionCodes = board.options || [];
    const collegeCodes = optionCodes.map(o => o.collegeCode);
    const branchCodes = optionCodes.map(o => o.branchCode);

    // Fetch colleges, branches and cutoffs in bulk
    const colleges = await College.find({ collegeCode: { $in: collegeCodes } });
    const collegeMap = new Map(colleges.map(c => [c.collegeCode, c]));

    const branches = await Branch.find({ branchCode: { $in: branchCodes } });
    const branchMap = new Map(branches.map(b => [b.branchCode, b]));

    const userCategories = mapCategory(student.category);
    const genderQuery = student.gender === 'GIRLS' ? ['BOYS', 'GIRLS'] : ['BOYS'];

    // Fetch cutoff rules matching user profile for the chosen colleges/branches
    const cutoffs = await Cutoff.find({
      collegeCode: { $in: collegeCodes },
      branchCode: { $in: branchCodes },
      category: { $in: userCategories },
      gender: { $in: genderQuery }
    });

    // Group cutoffs by collegeCode + branchCode to find the highest cutoff rank
    const cutoffMap = new Map<string, number>();
    cutoffs.forEach((c) => {
      const key = `${c.collegeCode}_${c.branchCode}`;
      const val = c.rank2025 > 0 ? c.rank2025 : c.weightedRank;
      if (val > 0) {
        const existing = cutoffMap.get(key) || 0;
        if (val > existing) cutoffMap.set(key, val);
      }
    });

    let dreamCount = 0;
    let targetCount = 0;
    let safeCount = 0;
    let overallRiskMultiplier = 1.0;

    // Map options with individual admission probabilities
    const enrichedOptions = optionCodes.map((opt) => {
      const college = collegeMap.get(opt.collegeCode);
      const branch = branchMap.get(opt.branchCode);
      const key = `${opt.collegeCode}_${opt.branchCode}`;
      const cutoffRank = cutoffMap.get(key) || 0;

      let probability = 0;
      let status: 'Dream' | 'Target' | 'Safe' = 'Dream';

      if (cutoffRank > 0) {
        const ratio = cutoffRank / student.rank;
        if (ratio >= 1.25) {
          probability = Math.min(99, Math.round(85 + (ratio - 1.25) * 15));
          status = 'Safe';
          safeCount++;
        } else if (ratio >= 1.0) {
          probability = Math.round(50 + ((ratio - 1.0) / 0.25) * 34);
          status = 'Target';
          targetCount++;
        } else if (ratio >= 0.7) {
          probability = Math.round(10 + ((ratio - 0.7) / 0.3) * 39);
          status = 'Dream';
          dreamCount++;
        } else {
          probability = Math.max(1, Math.round((ratio / 0.7) * 9));
          status = 'Dream';
          dreamCount++;
        }
      } else {
        // No cutoff data, default to conservative prediction
        probability = 50;
        status = 'Target';
        targetCount++;
      }

      // Calculate accumulated seat risk
      overallRiskMultiplier *= (1.0 - (probability / 100));

      return {
        collegeCode: opt.collegeCode,
        branchCode: opt.branchCode,
        priority: opt.priority,
        collegeName: college ? college.collegeName : opt.collegeCode,
        branchName: branch ? branch.branchName : opt.branchCode,
        tuitionFee: college ? college.tuitionFee : 0,
        averagePackage: college ? college.averagePackage : 0,
        placementPercentage: college ? college.placementPercentage : 0,
        cutoffRank,
        probability,
        status
      };
    });

    // Sort options by priority
    enrichedOptions.sort((a, b) => a.priority - b.priority);

    // AI Counselling Recommendation Engine
    let seatChance = 0;
    if (enrichedOptions.length > 0) {
      seatChance = Math.round((1.0 - overallRiskMultiplier) * 100);
    }

    const aiSuggestions: string[] = [];
    if (enrichedOptions.length === 0) {
      aiSuggestions.push('Your counselling board is empty. Add colleges from the Predictor or Explorer to get started.');
    } else {
      if (safeCount === 0) {
        aiSuggestions.push('Your options list is highly risky because it contains only Dream/Target colleges. Please add at least 3 Safe colleges to prevent blank allocation.');
      } else if (safeCount < 3) {
        aiSuggestions.push(`You have only ${safeCount} Safe college(s). We recommend adding at least ${3 - safeCount} more Safe college(s) to guarantee a secure admission.`);
      }

      if (dreamCount > 0 && enrichedOptions[0].status !== 'Dream') {
        aiSuggestions.push('Counselling Tip: Place your Dream colleges (like CBIT, Vasavi, VNR) at the top of your priority list. Since EAPCET matches from top to bottom, putting a Safe college first prevents you from even being considered for higher-tier Dream colleges.');
      }

      if (seatChance < 40) {
        aiSuggestions.push('Warning: Your overall seat probability is very low. Please add colleges with cutoffs well above your rank.');
      } else if (seatChance >= 85) {
        aiSuggestions.push('Excellent! Your counselling board is highly optimized and offers a secure pathway to admission. You have a well-balanced mix of Dream, Target, and Safe colleges.');
      }
    }

    res.json({
      options: enrichedOptions,
      analytics: {
        totalOptions: enrichedOptions.length,
        dreamCount,
        targetCount,
        safeCount,
        seatChance,
        studentRank: student.rank,
        studentCategory: student.category
      },
      aiSuggestions
    });
  } catch (error) {
    console.error('Fetch counselling board error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// POST /counselling/save
export const saveCounsellingBoard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { options } = req.body;

    if (!Array.isArray(options)) {
      return res.status(400).json({ message: 'Options list must be an array' });
    }

    // Validate and clean options
    const formattedOptions = options.map((opt: any, idx: number) => ({
      collegeCode: String(opt.collegeCode).toUpperCase().trim(),
      branchCode: String(opt.branchCode).toUpperCase().trim(),
      priority: Number(opt.priority) || (idx + 1)
    }));

    // Find and update or create
    let board = await CounsellingBoard.findOne({ userId });
    if (!board) {
      board = new CounsellingBoard({ userId, options: formattedOptions });
    } else {
      board.options = formattedOptions;
    }

    await board.save();

    // Track analytics action
    Analytics.create({
      userId,
      actionType: 'save_board',
      metadata: { totalOptions: formattedOptions.length }
    }).catch(err => console.error('Failed to log board analytics:', err));

    res.json({ message: 'Counselling options saved successfully', total: formattedOptions.length });
  } catch (error) {
    console.error('Save counselling board error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// PUT /counselling/reorder
export const reorderOptions = async (req: AuthRequest, res: Response) => {
  // To reorder, we can just pass the entire reordered list of options and call save.
  // Reusing save logic here for seamless frontend support
  return saveCounsellingBoard(req, res);
};
