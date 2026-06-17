import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import User from '../models/User';
import Student from '../models/Student';
import Wishlist from '../models/Wishlist';
import CounsellingBoard from '../models/CounsellingBoard';
import Analytics from '../models/Analytics';
import College from '../models/College';
import Branch from '../models/Branch';

// GET /admin/dashboard
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Core Metrics
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalSearches = await Analytics.countDocuments({ actionType: 'search' });
    const totalWishlists = await Wishlist.countDocuments({});
    
    // Count boards with active options
    const totalCounsellingBoards = await CounsellingBoard.countDocuments({
      'options.0': { $exists: true }
    });

    // 2. Category Distribution
    const categoryStats = await Student.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const categoryDistribution = categoryStats.map(item => ({
      category: item._id,
      count: item.count
    }));

    // 3. Rank Distribution
    const rankBuckets = await Student.aggregate([
      {
        $bucket: {
          groupBy: '$rank',
          boundaries: [0, 10000, 25000, 50000, 100000, 1000000],
          default: 'Other',
          output: { count: { $sum: 1 } }
        }
      }
    ]);
    
    const rankLabelMap: Record<string, string> = {
      '0': '0 - 10k',
      '10000': '10k - 25k',
      '25000': '25k - 50k',
      '50000': '50k - 100k',
      '100000': '100k+',
      'Other': 'Other'
    };

    const rankDistribution = rankBuckets.map(bucket => ({
      range: rankLabelMap[String(bucket._id)] || String(bucket._id),
      count: bucket.count
    }));

    // 4. Most Preferred College (top 5 by wishlist additions)
    const preferredCollegesAgg = await Wishlist.aggregate([
      { $group: { _id: '$collegeCode', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const collegeCodes = preferredCollegesAgg.map(item => item._id);
    const colleges = await College.find({ collegeCode: { $in: collegeCodes } }).select('collegeCode collegeName');
    const collegeNameMap = new Map(colleges.map(c => [c.collegeCode, c.collegeName]));

    const preferredColleges = preferredCollegesAgg.map(item => ({
      code: item._id,
      name: collegeNameMap.get(item._id) || item._id,
      count: item.count
    }));

    // 5. Most Preferred Branch (top 5 by wishlist additions)
    const preferredBranchesAgg = await Wishlist.aggregate([
      { $group: { _id: '$branchCode', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const branchCodes = preferredBranchesAgg.map(item => item._id);
    const branches = await Branch.find({ branchCode: { $in: branchCodes } }).select('branchCode branchName');
    const branchNameMap = new Map(branches.map(b => [b.branchCode, b.branchName]));

    const preferredBranches = preferredBranchesAgg.map(item => ({
      code: item._id,
      name: branchNameMap.get(item._id) || item._id,
      count: item.count
    }));

    res.json({
      metrics: {
        totalStudents,
        totalSearches,
        totalWishlists,
        totalCounsellingBoards
      },
      distributions: {
        categoryDistribution,
        rankDistribution,
        preferredColleges,
        preferredBranches
      }
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
