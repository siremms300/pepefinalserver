// routes/deliverySettingsRoutes.js
import { Router } from 'express';
import {
    getDeliverySettings,
    updateDeliverySettings,
    calculateDeliveryFee
} from '../controllers/deliverySettingsController.js';
import { authenticateToken, requireAdmin } from '../utils/authUtils.js';

const deliverySettingsRouter = Router();

// Public route for calculating delivery fee
deliverySettingsRouter.post('/calculate-fee', calculateDeliveryFee);

// Admin routes
deliverySettingsRouter.get('/', authenticateToken, requireAdmin, getDeliverySettings);
deliverySettingsRouter.put('/', authenticateToken, requireAdmin, updateDeliverySettings);

export default deliverySettingsRouter;