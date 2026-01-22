
import express from 'express';
import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryHierarchy
} from '../controllers/categoryControllers.js';
// import authMiddleware from '../middleware/authMiddleware.js';
// import adminMiddleware from '../middleware/adminMiddleware.js';
import { authenticateToken, requireAdmin } from '../utils/authUtils.js';
import multer from 'multer';

const CategoryRouter = Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
}); 

// Public routes
CategoryRouter.get('/', getCategories);

// Protected admin routes
// CategoryRouter.post('/', upload.single('image'), createCategory);
// CategoryRouter.put('/:id', authenticateToken, requireAdmin, upload.single('image'), updateCategory);
// CategoryRouter.delete('/:id', authenticateToken, requireAdmin, deleteCategory); 

CategoryRouter.post('/', authenticateToken, requireAdmin, upload.single('image'), createCategory);
CategoryRouter.put('/:id', authenticateToken, requireAdmin, upload.single('image'), updateCategory);
CategoryRouter.delete('/:id', authenticateToken, requireAdmin, deleteCategory);



// Add this to your category routes
CategoryRouter.get('/hierarchy', getCategoryHierarchy);

export default CategoryRouter;  


