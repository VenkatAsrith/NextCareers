import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import Student from '../models/Student';
import User from '../models/User';

// GET /profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profile = await Student.findOne({ userId });
    
    // If student user doesn't have a profile yet, initialize one
    if (!profile && user.role === 'student') {
      profile = await Student.create({
        userId,
        rank: 100000,
        category: 'OC',
        gender: 'BOYS',
        district: 'HYD',
        interestedBranches: []
      });
    }

    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      profile: profile ? {
        rank: profile.rank,
        category: profile.category,
        gender: profile.gender === 'GIRLS' ? 'Female' : 'Male', // Map to UI terms
        genderDb: profile.gender,
        district: profile.district,
        interestedBranches: profile.interestedBranches,
        mobile: profile.mobile
      } : null
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// PUT /profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { name, rank, category, gender, district, interestedBranches, mobile } = req.body;

    // 1. Update User name
    if (name) {
      await User.findByIdAndUpdate(userId, { name });
    }

    // 2. Map gender from UI to Database format
    // UI: 'Male' / 'Female' -> DB: 'BOYS' / 'GIRLS'
    let dbGender: 'BOYS' | 'GIRLS' = 'BOYS';
    if (gender) {
      dbGender = String(gender).toUpperCase() === 'FEMALE' || String(gender).toUpperCase() === 'GIRLS' ? 'GIRLS' : 'BOYS';
    }

    // 3. Update Student profile details
    let profile = await Student.findOne({ userId });
    if (!profile) {
      profile = new Student({
        userId,
        rank: Number(rank) || 100000,
        category: category || 'OC',
        gender: dbGender,
        district: district || 'HYD',
        interestedBranches: Array.isArray(interestedBranches) ? interestedBranches : [],
        mobile: mobile || ''
      });
    } else {
      profile.rank = Number(rank) !== undefined && !isNaN(Number(rank)) ? Number(rank) : profile.rank;
      if (category) profile.category = category;
      if (gender) profile.gender = dbGender;
      if (district) profile.district = district;
      if (interestedBranches) profile.interestedBranches = interestedBranches;
      if (mobile !== undefined) profile.mobile = mobile;
    }

    await profile.save();

    res.json({
      message: 'Profile updated successfully',
      profile: {
        name: name || '',
        rank: profile.rank,
        category: profile.category,
        gender: profile.gender === 'GIRLS' ? 'Female' : 'Male',
        district: profile.district,
        interestedBranches: profile.interestedBranches,
        mobile: profile.mobile
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
