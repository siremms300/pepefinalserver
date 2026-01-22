import CartProduct from '../models/cartProductModel.js';
import Product from '../models/productModel.js';

// Get user's cart
export const getCart = async (req, res) => {
    try {
        const userId = req.user._id;

        const cartItems = await CartProduct.find({ userId })
            .populate('productId')
            .sort({ createdAt: -1 });

        // Calculate totals and format response
        const formattedCart = await Promise.all(cartItems.map(async (item) => {
            const product = item.productId;
            if (!product) return null;

            const itemPrice = product.price;
            const wholesalePrice = product.wholesalePrice;
            const moq = product.moq || 1;
            const isWholesale = product.wholesaleEnabled && item.quantity >= moq;
            const currentPrice = isWholesale ? wholesalePrice : itemPrice;
            const subtotal = currentPrice * item.quantity;
            const savings = isWholesale ? (itemPrice - wholesalePrice) * item.quantity : 0;

            return {
                _id: item._id,
                product: {
                    _id: product._id,
                    name: product.name,
                    price: product.price,
                    wholesalePrice: product.wholesalePrice,
                    wholesaleEnabled: product.wholesaleEnabled,
                    moq: product.moq,
                    images: product.images,
                    status: product.status,
                    stock: product.stock,
                    brand: product.brand,
                    category: product.category
                },
                quantity: item.quantity,
                itemPrice: currentPrice,
                subtotal: subtotal,
                savings: savings,
                pricingTier: isWholesale ? 'wholesale' : 'retail',
                canWholesale: product.wholesaleEnabled && item.quantity < moq,
                moqRequired: Math.max(0, moq - item.quantity)
            };
        }));

        const validCartItems = formattedCart.filter(item => item !== null);
        
        // Calculate cart totals
        const subtotal = validCartItems.reduce((sum, item) => sum + item.subtotal, 0);
        const totalSavings = validCartItems.reduce((sum, item) => sum + item.savings, 0);
        const totalItems = validCartItems.reduce((sum, item) => sum + item.quantity, 0);

        res.json({
            success: true,
            data: {
                items: validCartItems,
                summary: {
                    subtotal,
                    totalSavings,
                    totalItems,
                    shipping: subtotal > 50 ? 0 : 5, // Free shipping over $50
                    total: subtotal + (subtotal > 50 ? 0 : 5)
                }
            }
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cart',
            error: error.message
        });
    }
};
 

// In your cartController.js - fix the getCartCount function


export const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user._id;

        // Validate product exists and is available
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.status !== 'Active') {
            return res.status(400).json({
                success: false,
                message: 'Product is not available'
            });
        }

        // Check if item already exists in cart
        let cartItem = await CartProduct.findOne({ userId, productId });

        if (cartItem) {
            // Update quantity if item exists
            const newQuantity = cartItem.quantity + quantity;
            
            // Check stock availability
            if (newQuantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.stock} items available in stock`
                });
            }

            cartItem.quantity = newQuantity;
            await cartItem.save();
        } else {
            // Check stock availability for new item
            if (quantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.stock} items available in stock`
                });
            }

            // Create new cart item
            cartItem = new CartProduct({
                userId,
                productId,
                quantity
            });
            await cartItem.save();
        }

        // Populate the saved cart item
        await cartItem.populate('productId');

        res.status(201).json({
            success: true,
            message: 'Product added to cart',
            data: cartItem
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding product to cart',
            error: error.message
        });
    }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
    try {
        const { cartItemId } = req.params;
        const { quantity } = req.body;
        const userId = req.user._id;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }

        const cartItem = await CartProduct.findOne({ _id: cartItemId, userId })
            .populate('productId');

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        // Check stock availability
        if (quantity > cartItem.productId.stock) {
            return res.status(400).json({
                success: false,
                message: `Only ${cartItem.productId.stock} items available in stock`
            });
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        res.json({
            success: true,
            message: 'Cart item updated',
            data: cartItem
        });
    } catch (error) {
        console.error('Update cart item error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating cart item',
            error: error.message
        });
    }
};

// Remove item from cart
export const removeCartItem = async (req, res) => {
    try {
        const { cartItemId } = req.params;
        const userId = req.user._id;

        const cartItem = await CartProduct.findOneAndDelete({ 
            _id: cartItemId, 
            userId 
        });

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        res.json({
            success: true,
            message: 'Item removed from cart'
        });
    } catch (error) {
        console.error('Remove cart item error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing item from cart',
            error: error.message
        });
    }
};

// Clear entire cart
export const clearCart = async (req, res) => {
    try {
        const userId = req.user._id;

        await CartProduct.deleteMany({ userId });

        res.json({
            success: true,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing cart',
            error: error.message
        });
    }
};

// // Get cart count
// export const getCartCount = async (req, res) => {
//     try {
//         const userId = req.user._id;

//         const cartCount = await CartProduct.aggregate([
//             { $match: { userId: new mongoose.Types.ObjectId(userId) } },
//             { $group: { _id: null, totalItems: { $sum: '$quantity' } } }
//         ]);

//         const totalItems = cartCount.length > 0 ? cartCount[0].totalItems : 0;

//         res.json({
//             success: true,
//             data: { totalItems }
//         });
//     } catch (error) {
//         console.error('Get cart count error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error getting cart count',
//             error: error.message
//         });
//     }
// };



// export const getCartCount = async (req, res) => {
//     try {
//         const userId = req.user._id;

//         const cartCount = await CartProduct.aggregate([
//             { 
//                 $match: { 
//                     userId: new mongoose.Types.ObjectId(userId) 
//                 } 
//             },
//             { 
//                 $group: { 
//                     _id: null, 
//                     totalItems: { $sum: '$quantity' } 
//                 } 
//             }
//         ]);

//         const totalItems = cartCount.length > 0 ? cartCount[0].totalItems : 0;

//         res.json({
//             success: true,
//             data: { totalItems }
//         });
//     } catch (error) {
//         console.error('Get cart count error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error getting cart count',
//             error: error.message
//         });
//     }
// };




export const getCartCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const cartItems = await CartProduct.find({ userId });
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

        res.json({
            success: true,
            data: { totalItems }
        });
    } catch (error) {
        console.error('Get cart count error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting cart count',
            error: error.message
        });
    }
};



