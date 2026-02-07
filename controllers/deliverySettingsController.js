// controllers/deliverySettingsController.js
import DeliverySettings from '../models/deliverySettingsModel.js';

// Get delivery settings
export const getDeliverySettings = async (req, res) => {
    try {
        let settings = await DeliverySettings.findOne();
        
        if (!settings) {
            // Create default settings if none exist
            settings = await DeliverySettings.create({
                createdBy: req.user._id
            });
        }
        
        res.json({
            success: true,
            message: "Delivery settings retrieved successfully",
            data: settings
        });
    } catch (error) {
        console.error("Get delivery settings error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get delivery settings",
            error: error.message
        });
    }
};

// Update delivery settings
export const updateDeliverySettings = async (req, res) => {
    try {
        const {
            storeLocation,
            defaultDeliveryPrices,
            deliveryHours,
            pickupHours,
            deliveryZones
        } = req.body;
        
        let settings = await DeliverySettings.findOne();
        
        if (!settings) {
            settings = await DeliverySettings.create({
                storeLocation,
                defaultDeliveryPrices,
                deliveryHours,
                pickupHours,
                deliveryZones,
                createdBy: req.user._id,
                updatedBy: req.user._id
            });
        } else {
            settings.storeLocation = storeLocation || settings.storeLocation;
            settings.defaultDeliveryPrices = defaultDeliveryPrices || settings.defaultDeliveryPrices;
            settings.deliveryHours = deliveryHours || settings.deliveryHours;
            settings.pickupHours = pickupHours || settings.pickupHours;
            settings.deliveryZones = deliveryZones || settings.deliveryZones;
            settings.updatedBy = req.user._id;
            
            await settings.save();
        }
        
        res.json({
            success: true,
            message: "Delivery settings updated successfully",
            data: settings
        });
    } catch (error) {
        console.error("Update delivery settings error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update delivery settings",
            error: error.message
        });
    }
};

// Calculate delivery fee
export const calculateDeliveryFee = async (req, res) => {
    try {
        const { location, subtotal, items } = req.body;
        
        // Get delivery settings
        const settings = await DeliverySettings.findOne();
        const defaultPrices = settings?.defaultDeliveryPrices || {
            withinBarnawa: { price: 800, freeThreshold: 500000 },
            outsideBarnawa: { price: 1200, freeThreshold: 1000000 }
        };
        
        let deliveryFee = 0;
        
        if (location === 'within_barnawa') {
            if (subtotal < defaultPrices.withinBarnawa.freeThreshold) {
                deliveryFee = defaultPrices.withinBarnawa.price;
            }
        } else if (location === 'outside_barnawa') {
            if (subtotal < defaultPrices.outsideBarnawa.freeThreshold) {
                deliveryFee = defaultPrices.outsideBarnawa.price;
            }
        } else if (location === 'pickup') {
            deliveryFee = 0;
        }
        
        res.json({
            success: true,
            message: "Delivery fee calculated",
            data: {
                deliveryFee,
                freeThreshold: location === 'within_barnawa' 
                    ? defaultPrices.withinBarnawa.freeThreshold 
                    : defaultPrices.outsideBarnawa.freeThreshold,
                location,
                subtotal
            }
        });
    } catch (error) {
        console.error("Calculate delivery fee error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to calculate delivery fee",
            error: error.message
        });
    }
};