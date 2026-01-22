
import express from 'express';
import { Router } from 'express';

import {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProductImage,
    getProductStats
} from '../controllers/productController.js'; 
import { authenticateToken, requireAdmin } from '../utils/authUtils.js'; 
import multer from 'multer';

const ProductRouter = Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit
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
ProductRouter.get('/', getProducts);
ProductRouter.get('/stats', getProductStats);
ProductRouter.get('/:id', getProduct);

// Protected admin routes
ProductRouter.post('/', authenticateToken, requireAdmin, upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'banners', maxCount: 5 }
]), createProduct);

ProductRouter.put('/:id', authenticateToken, requireAdmin, upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'banners', maxCount: 5 }
]), updateProduct);

ProductRouter.delete('/:id', authenticateToken, requireAdmin, deleteProduct);

// Fix: Use separate routes for image deletion instead of optional parameters
ProductRouter.delete('/:productId/images/:imageId', authenticateToken, requireAdmin, deleteProductImage);
ProductRouter.delete('/:productId/banners/:imageId', authenticateToken, requireAdmin, (req, res) => {
    req.params.type = 'banners';
    return deleteProductImage(req, res);
});

export default ProductRouter;



