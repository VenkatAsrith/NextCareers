import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Student from '../models/Student';

const JWT_SECRET = process.env.JWT_SECRET || 'nextcareers_secret_key_12345';

// POST /auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, rank, category, gender, district, interestedBranches } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const userRole = role === 'admin' ? 'admin' : 'student';
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: userRole
    });

    // Create Student profile if role is student
    if (userRole === 'student') {
      const studentRank = Number(rank) || 100000;
      const studentCategory = category || 'OC';
      const studentGender = (gender || 'BOYS').toUpperCase() === 'GIRLS' ? 'GIRLS' : 'BOYS';
      const studentDistrict = district || 'HYD';
      const studentBranches = Array.isArray(interestedBranches) ? interestedBranches : [];

      await Student.create({
        userId: newUser._id,
        rank: studentRank,
        category: studentCategory,
        gender: studentGender,
        district: studentDistrict,
        interestedBranches: studentBranches
      });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: newUser._id, role: newUser.role }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// POST /auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find User
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if student profile exists and fetch details (optional metadata)
    let studentProfile = null;
    if (user.role === 'student') {
      studentProfile = await Student.findOne({ userId: user._id });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: studentProfile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// GET /auth/me
export const getMe = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ userId: user._id });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile
      }
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
