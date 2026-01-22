// routes/addressRoutes.js
import express from 'express';
import {
    getUserAddresses,
    getAddress,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} from '../controllers/addressController.js';
import { authenticateToken } from '../utils/authUtils.js';

const addressRouter = express.Router();

// All routes require authentication
addressRouter.use(authenticateToken);

addressRouter.get('/', getUserAddresses);
addressRouter.get('/:addressId', getAddress);
addressRouter.post('/', createAddress);
addressRouter.put('/:addressId', updateAddress);
addressRouter.delete('/:addressId', deleteAddress);
addressRouter.patch('/:addressId/default', setDefaultAddress);

export default addressRouter;


