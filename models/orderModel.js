// models/orderModel.js - Updated schema
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: String,
        required: [true, "Provide orderId"],
        unique: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        name: {
            type: String,
            required: true
        },
        image: {
            type: String,
            default: ""
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        },
        pricingTier: {
            type: String,
            enum: ['retail', 'wholesale'],
            default: 'retail'
        },
        deliverySettings: {
            withinBarnawa: {
                enabled: { type: Boolean, default: true },
                price: { type: Number, default: 0 },
                freeThreshold: { type: Number, default: 0 }
            },
            outsideBarnawa: {
                enabled: { type: Boolean, default: true },
                price: { type: Number, default: 0 },
                freeThreshold: { type: Number, default: 0 }
            },
            pickupEnabled: { type: Boolean, default: true }
        }
    }],
    delivery_address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
    },
    delivery_location: {
        type: String,
        enum: ["pickup", "within_barnawa", "outside_barnawa"],
        default: "pickup"
    },
    delivery_info: {
        location: {
            type: String,
            enum: ["pickup", "within_barnawa", "outside_barnawa"]
        },
        fee: {
            type: Number,
            default: 0,
            min: 0
        },
        free_delivery_threshold: {
            type: Number,
            default: 0,
            min: 0
        },
        qualifies_for_free_delivery: {
            type: Boolean,
            default: false
        }
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    shipping: {
        type: Number,
        required: true,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    totalSavings: {
        type: Number,
        default: 0
    },
    order_status: {
        type: String,
        enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
        default: "pending"
    },
    payment_status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
    },
    payment_method: {
        type: String,
        enum: ["cod", "card", "paypal", "bank_transfer"],
        default: "cod"
    },
    payment_reference: {
        type: String 
    },
    notes: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
























































// // models/orderModel.js
// import mongoose from "mongoose";

// const orderSchema = new mongoose.Schema({
//     userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//     },
//     orderId: {
//         type: String,
//         required: [true, "Provide orderId"],
//         unique: true
//     },
//     items: [{
//         productId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Product",
//             required: true
//         },
//         name: {
//             type: String,
//             required: true
//         },
//         image: {
//             type: String,
//             default: ""
//         },
//         quantity: {
//             type: Number,
//             required: true,
//             min: 1
//         },
//         price: {
//             type: Number,
//             required: true
//         },
//         pricingTier: {
//             type: String,
//             enum: ['retail', 'wholesale'],
//             default: 'retail'
//         }
//     }],
//     delivery_address: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Address',
//         required: true
//     },
//     subtotal: {
//         type: Number,
//         required: true,
//         min: 0
//     },
//     shipping: {
//         type: Number,
//         required: true,
//         min: 0
//     },
//     total: {
//         type: Number,
//         required: true,
//         min: 0
//     },
//     totalSavings: {
//         type: Number,
//         default: 0
//     },
//     order_status: {
//         type: String,
//         enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
//         default: "pending"
//     },
//     payment_status: {
//         type: String,
//         enum: ["pending", "paid", "failed", "refunded"],
//         default: "pending"
//     },
//     payment_method: {
//         type: String,
//         enum: ["cod", "card", "paypal", "bank_transfer"],
//         default: "cod"
//     },
     
    
//     delivery_location: {
//         type: String,
//         enum: ['within_barnawa', 'outside_barnawa', 'pickup'],
//         default: 'pickup'
//     },
//     delivery_fee: {
//         type: Number,
//         default: 0,
//         min: 0
//     },
//     delivery_address: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Address'
//     },
//     delivery_instructions: {
//         type: String,
//         default: ""
//     },
    
//     notes: {
//         type: String,
//         default: ""
//     }
// }, {
//     timestamps: true
// });

// const Order = mongoose.model('Order', orderSchema);

// export default Order;











 

















// import mongoose from "mongoose";

// const orderSchema = new mongoose.Schema({
//     userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'user'
//     },
//     orderId: {
//         type: String,
//         required: [true, "Provide orderId"],
//         unique: true
//     },
//     productId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Product"
//     },
//     product_details: {
//         name: String,
//         image: Array
//     },
//       paymentId: {
//         type: String,
//         default: ""
//     },
//     payment_status: {
//         type: String,
//         default: ""
//     },
//     delivery_address: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Address'
//     },
//     subTotalAmt: {
//     type: Number,
//     default: 0
//     },
//     totalAmt: {
//         type: Number,
//         default: 0
//     },
//     // invoice_receipt: {
//     //     type: String,
//     //     default: ""
//     // }
// },
// {timestamps: true}
// );

// const Order = mongoose.model('Order', orderSchema);

// export default Order;

