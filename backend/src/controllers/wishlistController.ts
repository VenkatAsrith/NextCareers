import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import Wishlist from '../models/Wishlist';
import College from '../models/College';
import Branch from '../models/Branch';
import Analytics from '../models/Analytics';

// POST /wishlist
export const addToWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const { collegeCode, branchCode } = req.body;
    const userId = req.userId;

    if (!collegeCode || !branchCode) {
      return res.status(400).json({ message: 'College code and branch code are required' });
    }

    // Check if college exists
    const college = await College.findOne({ collegeCode: collegeCode.toUpperCase() });
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    // Check if already in wishlist
    const existing = await Wishlist.findOne({
      userId,
      collegeCode: collegeCode.toUpperCase(),
      branchCode: branchCode.toUpperCase()
    });

    if (existing) {
      return res.status(400).json({ message: 'Item is already in your wishlist' });
    }

    // Create wishlist entry
    const wishItem = await Wishlist.create({
      userId,
      collegeCode: collegeCode.toUpperCase(),
      branchCode: branchCode.toUpperCase()
    });

    // Track analytics action
    Analytics.create({
      userId,
      actionType: 'add_wishlist',
      metadata: { collegeCode, branchCode }
    }).catch(err => console.error('Failed to log wishlist analytics:', err));

    res.status(201).json(wishItem);
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// GET /wishlist
export const getWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const wishlistItems = await Wishlist.find({ userId });

    // Fetch colleges and branches in bulk to avoid N+1 queries
    const collegeCodes = wishlistItems.map(item => item.collegeCode);
    const branchCodes = wishlistItems.map(item => item.branchCode);

    const colleges = await College.find({ collegeCode: { $in: collegeCodes } });
    const collegeMap = new Map(colleges.map(c => [c.collegeCode, c]));

    const branches = await Branch.find({ branchCode: { $in: branchCodes } });
    const branchMap = new Map(branches.map(b => [b.branchCode, b]));

    const enrichedItems = wishlistItems.map((item) => {
      const college = collegeMap.get(item.collegeCode);
      const branch = branchMap.get(item.branchCode);

      return {
        _id: item._id,
        collegeCode: item.collegeCode,
        branchCode: item.branchCode,
        collegeName: college ? college.collegeName : item.collegeCode,
        branchName: branch ? branch.branchName : item.branchCode,
        district: college ? college.district : '',
        tuitionFee: college ? college.tuitionFee : 0,
        averagePackage: college ? college.averagePackage : 0,
        placementPercentage: college ? college.placementPercentage : 0,
        autonomous: college ? college.autonomous : false,
        coed: college ? college.coed : 'COED'
      };
    });

    res.json(enrichedItems);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// DELETE /wishlist/:id
export const deleteFromWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await Wishlist.findOneAndDelete({ _id: id, userId });
    if (!result) {
      return res.status(404).json({ message: 'Wishlist item not found or unauthorized' });
    }

    res.json({ message: 'Removed from wishlist successfully' });
  } catch (error) {
    console.error('Delete from wishlist error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
