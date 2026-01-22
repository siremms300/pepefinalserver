// servers/route/riderRoute.js
import { Router } from 'express';
import { 
    authenticateToken, 
    requireRider 
} from '../utils/authUtils.js';
import {
    getRiderProfileController,
    updateRiderProfileController,
    getRiderOrdersController,
    updateOrderStatusController,
    getRiderStatsController
} from '../controllers/riderControllers.js';

const riderRouter = Router();

// All rider routes require authentication and rider role
riderRouter.use(authenticateToken);
riderRouter.use(requireRider);

// Rider profile
riderRouter.get('/profile', getRiderProfileController);
riderRouter.put('/profile', updateRiderProfileController);

// Rider orders
riderRouter.get('/orders', getRiderOrdersController);
riderRouter.put('/orders/:id/status', updateOrderStatusController);

// Rider statistics
riderRouter.get('/stats', getRiderStatsController);

export default riderRouter;