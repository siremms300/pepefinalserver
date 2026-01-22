// controllers/addressController.js
import Address from '../models/addressModel.js';
import mongoose from 'mongoose';

// Get all addresses for user
export const getUserAddresses = async (req, res) => {
    try {
        const userId = req.user._id;

        const addresses = await Address.find({ userId }).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: addresses
        });
    } catch (error) {
        console.error('Get addresses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching addresses',
            error: error.message
        });
    }
};

// Get single address
export const getAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid address ID'
            });
        }

        const address = await Address.findOne({ _id: addressId, userId });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        res.json({
            success: true,
            data: address
        });
    } catch (error) {
        console.error('Get address error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching address',
            error: error.message
        });
    }
};

// Create new address
export const createAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { address_line, city, state, pincode, country, mobile, status = true } = req.body;

        // Validate required fields
        if (!address_line || !city || !state || !pincode || !country || !mobile) {
            return res.status(400).json({
                success: false,
                message: 'All address fields are required'
            });
        }

        const address = new Address({
            userId,
            address_line,
            city,
            state,
            pincode,
            country,
            mobile,
            status
        });

        await address.save();

        res.status(201).json({
            success: true,
            message: 'Address created successfully',
            data: address
        });
    } catch (error) {
        console.error('Create address error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating address',
            error: error.message
        });
    }
};

// Update address
export const updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userId = req.user._id;
        const { address_line, city, state, pincode, country, mobile, status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid address ID'
            });
        }

        const address = await Address.findOne({ _id: addressId, userId });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // Update fields
        if (address_line !== undefined) address.address_line = address_line;
        if (city !== undefined) address.city = city;
        if (state !== undefined) address.state = state;
        if (pincode !== undefined) address.pincode = pincode;
        if (country !== undefined) address.country = country;
        if (mobile !== undefined) address.mobile = mobile;
        if (status !== undefined) address.status = status;

        await address.save();

        res.json({
            success: true,
            message: 'Address updated successfully',
            data: address
        });
    } catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating address',
            error: error.message
        });
    }
};

// Delete address
export const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid address ID'
            });
        }

        const address = await Address.findOneAndDelete({ _id: addressId, userId });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        res.json({
            success: true,
            message: 'Address deleted successfully'
        });
    } catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting address',
            error: error.message
        });
    }
};

// Set default address
export const setDefaultAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid address ID'
            });
        }

        // First, set all addresses to non-default
        await Address.updateMany(
            { userId }, 
            { status: false }
        );

        // Then set the selected address as default
        const address = await Address.findOneAndUpdate(
            { _id: addressId, userId },
            { status: true },
            { new: true }
        );

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        res.json({
            success: true,
            message: 'Default address set successfully',
            data: address
        });
    } catch (error) {
        console.error('Set default address error:', error);
        res.status(500).json({
            success: false,
            message: 'Error setting default address',
            error: error.message
        });
    }
};


