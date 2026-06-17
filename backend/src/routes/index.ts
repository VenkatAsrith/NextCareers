import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { predictColleges } from '../controllers/predictorController';
import { getColleges, getFilters, getCollegeById } from '../controllers/collegeController';
import { addToWishlist, getWishlist, deleteFromWishlist } from '../controllers/wishlistController';
import { getCounsellingBoard, saveCounsellingBoard, reorderOptions } from '../controllers/counsellingController';
import { getProfile, updateProfile } from '../controllers/profileController';
import { getDashboardStats } from '../controllers/adminController';
import { handleChatQuery } from '../controllers/chatController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// Authentication
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticateToken, getMe);

// College Predictor (Anonymous query allowed, but profile info is used if authenticated)
router.post('/predict', predictColleges);

// College Explorer
router.get('/colleges', getColleges);
router.get('/colleges/filters', getFilters);
router.get('/colleges/:id', getCollegeById);

// Wishlist System (requires auth)
router.post('/wishlist', authenticateToken, addToWishlist);
router.get('/wishlist', authenticateToken, getWishlist);
router.delete('/wishlist/:id', authenticateToken, deleteFromWishlist);

// Mock Counselling Board (requires auth)
router.get('/counselling', authenticateToken, getCounsellingBoard);
router.post('/counselling/save', authenticateToken, saveCounsellingBoard);
router.put('/counselling/reorder', authenticateToken, reorderOptions);

// Student Profile (requires auth)
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

// Admin Dashboard (requires auth + admin role)
router.get('/admin/dashboard', authenticateToken, requireAdmin, getDashboardStats);

// Chatbot Assistant (requires auth)
router.post('/chat', authenticateToken, handleChatQuery);

export default router;
