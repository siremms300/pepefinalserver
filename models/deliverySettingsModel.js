// models/deliverySettingsModel.js
import mongoose from "mongoose";

const deliverySettingsSchema = new mongoose.Schema({
    storeLocation: {
        name: {
            type: String,
            default: "Pepe's Brunch and Cafe"
        },
        address: {
            type: String,
            default: "Elgibon Plaze, Opposite Barnawa Market, Kaduna"
        },
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    defaultDeliveryPrices: {
        withinBarnawa: {
            price: {
                type: Number,
                default: 800,
                min: 0
            },
            freeThreshold: {
                type: Number,
                default: 500000,
                min: 0
            }
        },
        outsideBarnawa: {
            price: {
                type: Number,
                default: 1200,
                min: 0
            },
            freeThreshold: {
                type: Number,
                default: 1000000,
                min: 0
            }
        }
    },
    deliveryHours: {
        start: {
            type: String,
            default: "08:00"
        },
        end: {
            type: String,
            default: "19:00"
        },
        days: {
            type: [String],
            enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
            default: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
        }
    },
    pickupHours: {
        start: {
            type: String,
            default: "08:00"
        },
        end: {
            type: String,
            default: "20:00"
        }
    },
    deliveryZones: [{
        name: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['within_barnawa', 'outside_barnawa'],
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        freeThreshold: {
            type: Number,
            default: 0,
            min: 0
        },
        estimatedTime: {
            type: String,
            default: "45-60 minutes"
        },
        areas: [String]
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { 
    timestamps: true 
});

const DeliverySettings = mongoose.model('DeliverySettings', deliverySettingsSchema);
export default DeliverySettings;