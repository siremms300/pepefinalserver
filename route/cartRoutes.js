import express from 'express';
import { Router } from 'express';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    getCartCount
} from '../controllers/cartController.js';
import { authenticateToken } from '../utils/authUtils.js';

const cartRouter = Router();

// All routes require authentication
cartRouter.use(authenticateToken);

cartRouter.get('/', getCart);
cartRouter.get('/count', getCartCount);
cartRouter.post('/add', addToCart);
cartRouter.put('/update/:cartItemId', updateCartItem);
cartRouter.delete('/remove/:cartItemId', removeCartItem);
cartRouter.delete('/clear', clearCart);

export default cartRouter;


