import { Request, Response } from 'express';
import College from '../models/College';
import Cutoff from '../models/Cutoff';
import Branch from '../models/Branch';

// GET /colleges
export const getColleges = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { district, type, autonomous, branch, minFee, maxFee, minPlacement, sort, search } = req.query;

    const query: any = {};

    // Filter by search keyword (on name or code)
    if (search) {
      query.$or = [
        { collegeName: { $regex: search, $options: 'i' } },
        { collegeCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by district
    if (district) {
      query.district = String(district).toUpperCase();
    }

    // Filter by college type (PVT, GOV, UNIV, SF)
    if (type) {
      query.type = String(type).toUpperCase();
    }

    // Filter by autonomous status
    if (autonomous) {
      query.autonomous = autonomous === 'true';
    }

    // Filter by fee range
    if (minFee || maxFee) {
      query.tuitionFee = {};
      if (minFee) query.tuitionFee.$gte = Number(minFee);
      if (maxFee) query.tuitionFee.$lte = Number(maxFee);
    }

    // Filter by placement percentage
    if (minPlacement) {
      query.placementPercentage = { $gte: Number(minPlacement) };
    }

    // Filter by branch
    // If a branch code is provided, we fetch all collegeCodes that offer that branch from the Cutoff database
    if (branch) {
      const branchCutoffs = await Cutoff.find({ branchCode: String(branch).toUpperCase() }).distinct('collegeCode');
      query.collegeCode = { $in: branchCutoffs };
    }

    // Sorting options
    let sortOption: any = {};
    if (sort === 'highestPackage') {
      sortOption = { highestPackage: -1 };
    } else if (sort === 'lowestFee') {
      sortOption = { tuitionFee: 1 };
    } else if (sort === 'highestPlacement') {
      sortOption = { placementPercentage: -1 };
    } else {
      // Best match or default: sort by averagePackage descending then collegeName ascending
      sortOption = { averagePackage: -1, collegeName: 1 };
    }

    // Fetch colleges matching query
    const colleges = await College.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination metadata
    const total = await College.countDocuments(query);

    // Enrich colleges with their offered branches
    const enrichedColleges = await Promise.all(
      colleges.map(async (college) => {
        const branchCodes = await Cutoff.find({ collegeCode: college.collegeCode }).distinct('branchCode');
        return {
          ...college.toObject(),
          branches: branchCodes
        };
      })
    );

    res.json({
      colleges: enrichedColleges,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch colleges error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// GET /colleges/filters (convenience endpoint to get unique districts, branches, and types for UI dropdowns)
export const getFilters = async (req: Request, res: Response) => {
  try {
    const districts = await College.distinct('district');
    const types = await College.distinct('type');
    
    // Fetch all active branch codes and names
    const activeBranchCodes = await Cutoff.distinct('branchCode');
    const branches = await Branch.find({ branchCode: { $in: activeBranchCodes } }).select('branchCode branchName');

    res.json({
      districts: districts.sort(),
      types: types.sort(),
      branches: branches.sort((a, b) => a.branchCode.localeCompare(b.branchCode))
    });
  } catch (error) {
    console.error('Fetch filters error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// GET /colleges/:id
export const getCollegeById = async (req: Request, res: Response) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    // Fetch cutoff details for this college
    const cutoffs = await Cutoff.find({ collegeCode: college.collegeCode });
    
    // Fetch unique branches offered
    const branchCodes = await Cutoff.find({ collegeCode: college.collegeCode }).distinct('branchCode');
    const branches = await Branch.find({ branchCode: { $in: branchCodes } });

    res.json({
      college,
      branches,
      cutoffs
    });
  } catch (error) {
    console.error('Fetch college by ID error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
