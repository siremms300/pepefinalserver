// server/models/productModel
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true
    },
    description: {
        type: String,
        required: [true, "Product description is required"]
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, "Category is required"]
    },
    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    thirdCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price cannot be negative"]
    },
    oldPrice: {
        type: Number,
        min: [0, "Old price cannot be negative"]
    },
    retailPrice: {
        type: Number,
        min: [0, "Retail price cannot be negative"]
    },
    wholesalePrice: {
        type: Number,
        min: [0, "Wholesale price cannot be negative"]
    },
    moq: {
        type: Number,
        default: 1,
        min: [1, "MOQ must be at least 1"]
    },
    pricingTier: {
        type: String,
        enum: ['Basic', 'Standard', 'Premium', 'Enterprise'],
        default: 'Standard'
    },
    stock: {
        type: Number,
        required: [true, "Stock quantity is required"],
        min: [0, "Stock cannot be negative"],
        default: 0
    },
    rating: {
        type: Number,
        min: [0, "Rating cannot be less than 0"],
        max: [5, "Rating cannot be more than 5"],
        default: 0
    },
    brand: {
        type: String,
        required: [true, "Brand is required"],
        trim: true
    },
    discount: {
        type: Number,
        min: [0, "Discount cannot be negative"],
        max: [100, "Discount cannot exceed 100%"],
        default: 0
    },
    size: {
        type: String,
        trim: true
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        public_id: {
            type: String,
            required: true
        }
    }],
    banners: [{
        url: {
            type: String
        },
        public_id: {
            type: String
        },
        title: {
            type: String,
            default: ""
        }
    }],
    bannerTitle: {
        type: String,
        default: ""
    },
    featured: {
        type: Boolean,
        default: false
    },
    wholesaleEnabled: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Draft', 'Out of Stock'],
        default: 'Active'
    },
    sku: {
        type: String,
        unique: true,
        sparse: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    specifications: {
        type: Map,
        of: String
    },
    weight: {
        type: Number,
        min: [0, "Weight cannot be negative"]
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number
    },
       // Delivery Settings
    deliveryEnabled: {
        type: Boolean,
        default: true
    },
    deliverySettings: {
        withinBarnawa: {
            enabled: {
                type: Boolean,
                default: true
            },
            price: {
                type: Number,
                default: 0,
                min: 0
            },
            freeThreshold: {
                type: Number,
                default: 0,
                min: 0
            }
        },
        outsideBarnawa: {
            enabled: {
                type: Boolean,
                default: true
            },
            price: {
                type: Number,
                default: 0,
                min: 0
            },
            freeThreshold: {
                type: Number,
                default: 0,
                min: 0
            }
        },
        pickupEnabled: {
            type: Boolean,
            default: true
        }
    },
     
    seo: {
        title: String,
        description: String,
        keywords: [String]
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { 
    timestamps: true
});

// Generate SKU before saving
productSchema.pre('save', async function(next) {
    if (!this.sku) {
        const count = await mongoose.model('Product').countDocuments();
        this.sku = `PROD${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
    if (this.oldPrice && this.oldPrice > this.price) {
        return Math.round(((this.oldPrice - this.price) / this.oldPrice) * 100);
    }
    return 0;
});

// Index for better query performance
productSchema.index({ category: 1, status: 1 });
productSchema.index({ featured: 1, status: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ sku: 1 });

const ProductModel = mongoose.model("Product", productSchema);

export default ProductModel;








    
 