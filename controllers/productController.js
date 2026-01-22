import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import cloudinary from '../config/cloudinary.js';

// Upload image to Cloudinary
const uploadToCloudinary = async (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                folder: `jubian/${folder}`
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        ).end(fileBuffer);
    });
};

// Get all products with filtering, sorting and pagination
// export const getProducts = async (req, res) => {
//     try {
//         const {
//             page = 1,
//             limit = 10,
//             search,
//             category,
//             status,
//             featured,
//             minPrice,
//             maxPrice,
//             sortBy = 'createdAt',
//             sortOrder = 'desc'
//         } = req.query;

//         // Build filter object
//         let filter = {};
        
//         if (search) {
//             filter.$or = [
//                 { name: { $regex: search, $options: 'i' } },
//                 { description: { $regex: search, $options: 'i' } },
//                 { brand: { $regex: search, $options: 'i' } },
//                 { sku: { $regex: search, $options: 'i' } }
//             ];
//         }

//         if (category) {
//             filter.category = category;
//         }

//         if (status) {
//             filter.status = status;
//         }

//         if (featured !== undefined) {
//             filter.featured = featured === 'true';
//         }

//         if (minPrice || maxPrice) {
//             filter.price = {};
//             if (minPrice) filter.price.$gte = parseFloat(minPrice);
//             if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
//         }

//         // Sort configuration
//         const sortConfig = {};
//         sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

//         const products = await Product.find(filter)
//             .populate('category', 'name images')
//             .populate('subCategory', 'name')
//             .populate('thirdCategory', 'name')
//             .populate('createdBy', 'name email')
//             .sort(sortConfig)
//             .limit(limit * 1)
//             .skip((page - 1) * limit);

//         const total = await Product.countDocuments(filter);

//         res.json({
//             success: true,
//             data: products,
//             pagination: {
//                 currentPage: parseInt(page),
//                 totalPages: Math.ceil(total / limit),
//                 totalProducts: total,
//                 hasNext: page * limit < total,
//                 hasPrev: page > 1
//             }
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching products',
//             error: error.message
//         });
//     }
// };



// In your productController.js - update the getProducts function
export const getProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            category, // This can now be comma-separated category IDs
            status,
            featured,
            minPrice,
            maxPrice,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        let filter = {};
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }

        // Handle multiple categories
        if (category) {
            const categoryIds = category.split(',');
            if (categoryIds.length === 1) {
                filter.category = categoryIds[0];
            } else {
                filter.category = { $in: categoryIds };
            }
        }

        if (status) {
            filter.status = status;
        }

        if (featured !== undefined) {
            filter.featured = featured === 'true';
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }

        // Sort configuration
        const sortConfig = {};
        sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const products = await Product.find(filter)
            .populate('category', 'name images')
            .populate('subCategory', 'name')
            .populate('thirdCategory', 'name')
            .populate('createdBy', 'name email')
            .sort(sortConfig)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Product.countDocuments(filter);

        res.json({
            success: true,
            data: products,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalProducts: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
};




// Get single product
export const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name images')
            .populate('subCategory', 'name')
            .populate('thirdCategory', 'name')
            .populate('createdBy', 'name email');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
};

// Create product
export const createProduct = async (req, res) => {
    try {
        const productData = JSON.parse(req.body.productData);
        const imageFiles = req.files?.images || [];
        const bannerFiles = req.files?.banners || [];

        // Validate category exists
        const category = await Category.findById(productData.category);
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }

        // Upload product images
        const productImages = [];
        for (const file of imageFiles) {
            try {
                const result = await uploadToCloudinary(file.buffer, 'products');
                productImages.push({
                    url: result.secure_url,
                    public_id: result.public_id
                });
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError);
                // Continue with other images even if one fails
            }
        }

        // Upload banner images
        const bannerImages = [];
        for (const file of bannerFiles) {
            try {
                const result = await uploadToCloudinary(file.buffer, 'banners');
                bannerImages.push({
                    url: result.secure_url,
                    public_id: result.public_id,
                    title: productData.bannerTitle || ''
                });
            } catch (uploadError) {
                console.error('Banner upload failed:', uploadError);
                // Continue with other banners even if one fails
            }
        }

        // Create product
        const product = new Product({
            ...productData,
            images: productImages,
            banners: bannerImages,
            createdBy: req.user._id
        });

        await product.save();

        // Populate the created product
        const populatedProduct = await Product.findById(product._id)
            .populate('category', 'name images')
            .populate('subCategory', 'name')
            .populate('thirdCategory', 'name')
            .populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: populatedProduct
        });
    } catch (error) {
        console.error('Product creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
};

// Update product
export const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const productData = req.body.productData ? JSON.parse(req.body.productData) : {};
        const imageFiles = req.files?.images || [];
        const bannerFiles = req.files?.banners || [];

        // Find existing product
        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Upload new product images
        const newProductImages = [];
        for (const file of imageFiles) {
            try {
                const result = await uploadToCloudinary(file.buffer, 'products');
                newProductImages.push({
                    url: result.secure_url,
                    public_id: result.public_id
                });
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError);
            }
        }

        // Upload new banner images
        const newBannerImages = [];
        for (const file of bannerFiles) {
            try {
                const result = await uploadToCloudinary(file.buffer, 'banners');
                newBannerImages.push({
                    url: result.secure_url,
                    public_id: result.public_id,
                    title: productData.bannerTitle || existingProduct.bannerTitle
                });
            } catch (uploadError) {
                console.error('Banner upload failed:', uploadError);
            }
        }

        // Update product
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                ...productData,
                $push: {
                    images: { $each: newProductImages },
                    banners: { $each: newBannerImages }
                }
            },
            { new: true, runValidators: true }
        ).populate('category', 'name images')
         .populate('subCategory', 'name')
         .populate('thirdCategory', 'name')
         .populate('createdBy', 'name email');

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        console.error('Product update error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
};

// Delete product
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Delete images from Cloudinary
        const deletePromises = [];
        
        // Delete product images
        product.images.forEach(image => {
            if (image.public_id) {
                deletePromises.push(cloudinary.uploader.destroy(image.public_id));
            }
        });

        // Delete banner images
        product.banners.forEach(banner => {
            if (banner.public_id) {
                deletePromises.push(cloudinary.uploader.destroy(banner.public_id));
            }
        });

        // Wait for all deletions to complete
        await Promise.all(deletePromises);

        // Delete product from database
        await Product.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Product deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
};

// Delete product image



// Delete product image
export const deleteProductImage = async (req, res) => {
    try {
        const { productId, imageId } = req.params;
        // Determine type from route or query parameter
        const type = req.params.type || req.query.type || 'images';

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        let imageArray, imageField;
        if (type === 'banners') {
            imageArray = product.banners;
            imageField = 'banners';
        } else {
            imageArray = product.images;
            imageField = 'images';
        }

        const imageToDelete = imageArray.id(imageId);
        if (!imageToDelete) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        // Delete from Cloudinary
        if (imageToDelete.public_id) {
            await cloudinary.uploader.destroy(imageToDelete.public_id);
        }

        // Remove from product
        imageArray.pull(imageId);
        await product.save();

        res.json({
            success: true,
            message: `${type === 'banners' ? 'Banner' : 'Image'} deleted successfully`
        });
    } catch (error) {
        console.error('Image deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting image',
            error: error.message
        });
    }
};



// Get product statistics
export const getProductStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const activeProducts = await Product.countDocuments({ status: 'Active' });
        const outOfStockProducts = await Product.countDocuments({ status: 'Out of Stock' });
        const featuredProducts = await Product.countDocuments({ featured: true });

        // Get products by category
        const productsByCategory = await Product.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $unwind: '$categoryInfo'
            },
            {
                $project: {
                    categoryName: '$categoryInfo.name',
                    count: 1
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                totalProducts,
                activeProducts,
                outOfStockProducts,
                featuredProducts,
                productsByCategory
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching product statistics',
            error: error.message
        });
    }
};





