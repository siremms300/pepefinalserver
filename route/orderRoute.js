// routes/orderRoutes.js - Fixed version
import { Router } from 'express';
import {
    createOrder,
    getUserOrders,
    getOrder,
    updateOrderStatus,
    getAllOrders,
    updateOrderStatusAdmin,
    deleteOrder,
    getOrderStats,
    verifyPaystackPayment
} from '../controllers/orderController.js';
import { authenticateToken, requireAdmin } from '../utils/authUtils.js';

const orderRouter = Router();

// All routes require authentication
orderRouter.use(authenticateToken);

// Regular user routes
orderRouter.post('/create', createOrder);
orderRouter.get('/', getUserOrders);
orderRouter.get('/:orderId', getOrder);
orderRouter.put('/:orderId/status', updateOrderStatus);
orderRouter.post('/verify-payment', verifyPaystackPayment); 

// Admin only routes - FIXED ENDPOINTS
orderRouter.get('/admin/all', requireAdmin, getAllOrders);
orderRouter.put('/admin/orders/:id/status', requireAdmin, updateOrderStatusAdmin);
orderRouter.delete('/admin/orders/:id', requireAdmin, deleteOrder);
orderRouter.get('/admin/stats', requireAdmin, getOrderStats);

export default orderRouter;







































// // routes/orderRoutes.js
// import express from 'express';
// import { Router } from 'express';
// import {
//     createOrder,
//     getUserOrders,
//     getOrder,
//     updateOrderStatus,
//     getAllOrders,
//     updateOrderStatusAdmin,
//     deleteOrder,
//     getOrderStats
// } from '../controllers/orderController.js';
// import { authenticateToken, requireAdmin } from '../utils/authUtils.js';

// const orderRouter = Router();

// // All routes require authentication
// orderRouter.use(authenticateToken);

// orderRouter.post('/create', createOrder);
// orderRouter.get('/', getUserOrders);
// orderRouter.get('/:orderId', getOrder);
// orderRouter.put('/:orderId/status', updateOrderStatus);


// orderRouter.get('/all', requireAdmin, getAllOrders);
// orderRouter.put('/orders/:id/status', requireAdmin, updateOrderStatusAdmin);
// orderRouter.delete('/orders/:id', requireAdmin, deleteOrder);
// orderRouter.get('/orders/stats', requireAdmin, getOrderStats);

// export default orderRouter; 



