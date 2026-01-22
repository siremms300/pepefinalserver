
import Order from '../models/orderModel.js';
import CartProduct from '../models/cartProductModel.js';
import Product from '../models/productModel.js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { sendEmail } from '../config/sendEmail.js';
import User from '../models/userModel.js';

// Paystack initialization
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Create new order with Paystack
// export const createOrder = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const { delivery_address, payment_method = 'cod', notes = '', payment_reference } = req.body;

//         // Validate required fields
//         if (!delivery_address) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Delivery address is required'
//             });
//         }

//         // Get user's cart
//         const cartItems = await CartProduct.find({ userId }).populate('productId');
        
//         if (!cartItems || cartItems.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Cart is empty'
//             });
//         }

//         // Calculate order totals and validate stock
//         let subtotal = 0;
//         let totalSavings = 0;
//         const orderItems = [];

//         for (const cartItem of cartItems) {
//             const product = cartItem.productId;
            
//             if (!product) {
//                 return res.status(400).json({
//                     success: false,
//                     message: `Product not found for cart item ${cartItem._id}`
//                 });
//             }

//             // Check stock availability
//             if (cartItem.quantity > product.stock) {
//                 return res.status(400).json({
//                     success: false,
//                     message: `Only ${product.stock} items available for ${product.name}`
//                 });
//             }

//             // Calculate pricing
//             const isWholesale = product.wholesaleEnabled && cartItem.quantity >= (product.moq || 1);
//             const currentPrice = isWholesale ? product.wholesalePrice : product.price;
//             const itemSubtotal = currentPrice * cartItem.quantity;
//             const savings = isWholesale ? (product.price - product.wholesalePrice) * cartItem.quantity : 0;

//             subtotal += itemSubtotal;
//             totalSavings += savings;

//             orderItems.push({
//                 productId: product._id,
//                 name: product.name,
//                 image: product.images[0]?.url || '',
//                 quantity: cartItem.quantity,
//                 price: currentPrice,
//                 pricingTier: isWholesale ? 'wholesale' : 'retail'
//             });
//         }

//         // Calculate shipping (free over ₦50,000)
//         const shipping = subtotal > 50000 ? 0 : 5000;
//         const total = subtotal + shipping;

//         // Generate unique order ID
//         const orderId = `ORD-${uuidv4().split('-')[0].toUpperCase()}`;

//         // Create order
//         const order = new Order({
//             userId,
//             orderId,
//             items: orderItems,
//             delivery_address,
//             subtotal,
//             shipping,
//             total,
//             totalSavings,
//             payment_method,
//             payment_status: payment_method === 'cod' ? 'pending' : 'pending',
//             notes,
//             order_status: 'pending'
//         });

//         // For Paystack payments, verify payment
//         if (payment_method === 'card' && payment_reference) {
//             try {
//                 // Verify Paystack payment
//                 const verifyResponse = await axios.get(
//                     `https://api.paystack.co/transaction/verify/${payment_reference}`,
//                     {
//                         headers: {
//                             Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
//                         }
//                     }
//                 );

//                 const paymentData = verifyResponse.data.data;
                
//                 if (paymentData.status === 'success') {
//                     // Verify amount matches
//                     const amountInKobo = paymentData.amount;
//                     const amountInNaira = amountInKobo / 100;
                    
//                     if (Math.abs(amountInNaira - total) > 1) {
//                         return res.status(400).json({
//                             success: false,
//                             message: 'Payment amount does not match order total'
//                         });
//                     }

//                     // Update payment status
//                     order.payment_status = 'paid';
//                     order.payment_reference = payment_reference;
                    
//                     // Reduce stock for each product
//                     for (const item of orderItems) {
//                         await Product.findByIdAndUpdate(item.productId, {
//                             $inc: { stock: -item.quantity }
//                         });
//                     }
//                 }
//             } catch (error) {
//                 console.error('Paystack verification error:', error);
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Payment verification failed'
//                 });
//             }
//         }

//         await order.save();

//         // Clear cart after successful order creation
//         await CartProduct.deleteMany({ userId });

//         // Populate the order for response
//         await order.populate('delivery_address');

//         // Get user details for email notification
//         const user = await User.findById(userId);
        
//         // Send email notification to admin
//         await sendOrderEmailNotification(order, user);

//         res.status(201).json({
//             success: true,
//             message: 'Order created successfully',
//             data: order,
//             paystack_public_key: process.env.PAYSTACK_PUBLIC_KEY
//         });

//     } catch (error) {
//         console.error('Create order error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error creating order',
//             error: error.message
//         });
//     }
// };

// controllers/orderController.js - Optimized
// export const createOrder = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const { delivery_address, payment_method = 'cod', notes = '', payment_reference } = req.body;

//         // Quick validation
//         if (!delivery_address) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Delivery address required'
//             });
//         }

//         // Get cart items with minimal population
//         const cartItems = await CartProduct.find({ userId })
//             .populate('productId', 'name price wholesalePrice wholesaleEnabled stock moq images')
//             .lean(); // Use lean() for faster queries

//         if (!cartItems || cartItems.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Cart is empty'
//             });
//         }

//         // Calculate totals in parallel where possible
//         const calculations = await Promise.all(
//             cartItems.map(async (cartItem) => {
//                 const product = cartItem.productId;
                
//                 // Quick stock check
//                 if (cartItem.quantity > product.stock) {
//                     throw new Error(`Only ${product.stock} available for ${product.name}`);
//                 }

//                 const isWholesale = product.wholesaleEnabled && cartItem.quantity >= (product.moq || 1);
//                 const currentPrice = isWholesale ? product.wholesalePrice : product.price;
//                 const itemSubtotal = currentPrice * cartItem.quantity;
//                 const savings = isWholesale ? (product.price - product.wholesalePrice) * cartItem.quantity : 0;

//                 return {
//                     item: {
//                         productId: product._id,
//                         name: product.name,
//                         image: product.images?.[0]?.url || '',
//                         quantity: cartItem.quantity,
//                         price: currentPrice,
//                         pricingTier: isWholesale ? 'wholesale' : 'retail'
//                     },
//                     subtotal: itemSubtotal,
//                     savings: savings
//                 };
//             })
//         );

//         const orderItems = calculations.map(c => c.item);
//         const subtotal = calculations.reduce((sum, c) => sum + c.subtotal, 0);
//         const totalSavings = calculations.reduce((sum, c) => sum + c.savings, 0);
        
//         const shipping = subtotal > 50000 ? 0 : 5000;
//         const total = subtotal + shipping;

//         // Generate order ID
//         const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

//         // Create order without saving yet
//         const order = new Order({
//             userId,
//             orderId,
//             items: orderItems,
//             delivery_address,
//             subtotal,
//             shipping,
//             total,
//             totalSavings,
//             payment_method,
//             payment_status: payment_method === 'cod' ? 'pending' : 'pending',
//             notes,
//             order_status: 'pending'
//         });

//         // Handle Paystack payment
//         if (payment_method === 'card' && payment_reference) {
//             try {
//                 // Quick Paystack verification
//                 const verifyResponse = await axios.get(
//                     `https://api.paystack.co/transaction/verify/${payment_reference}`,
//                     {
//                         headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
//                         timeout: 5000 // 5 second timeout
//                     }
//                 );

//                 const paymentData = verifyResponse.data.data;
                
//                 if (paymentData.status === 'success') {
//                     // Quick amount check (allow 1 Naira difference for rounding)
//                     const amountInNaira = paymentData.amount / 100;
//                     if (Math.abs(amountInNaira - total) > 1) {
//                         return res.status(400).json({
//                             success: false,
//                             message: 'Payment amount mismatch'
//                         });
//                     }

//                     order.payment_status = 'paid';
//                     order.payment_reference = payment_reference;

//                     // Update stock in background (don't wait for it)
//                     Product.bulkWrite(
//                         orderItems.map(item => ({
//                             updateOne: {
//                                 filter: { _id: item.productId },
//                                 update: { $inc: { stock: -item.quantity } }
//                             }
//                         }))
//                     ).catch(console.error);
//                 }
//             } catch (error) {
//                 console.error('Paystack quick verification failed:', error.message);
//                 // Continue without verification for now, mark as pending
//             }
//         }

//         // Save order
//         await order.save();

//         // Clear cart in background
//         CartProduct.deleteMany({ userId }).catch(console.error);

//         // Return response immediately, don't wait for emails
//         res.status(201).json({
//             success: true,
//             message: 'Order created successfully',
//             data: {
//                 orderId: order.orderId,
//                 total: order.total,
//                 payment_method: order.payment_method,
//                 payment_status: order.payment_status,
//                 created_at: order.createdAt
//             }
//         });

//         // Send emails in background
//         sendOrderEmailsInBackground(order, req.user);

//     } catch (error) {
//         console.error('Create order error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error creating order',
//             error: error.message
//         });
//     }
// };

// controllers/orderController.js - Updated createOrder function
export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      delivery_address, 
      payment_method = 'cod', 
      notes = '', 
      payment_reference,
      cartItems // Accept cart items from frontend request
    } = req.body;

    // Quick validation
    if (!delivery_address) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address required'
      });
    }

    let orderItems = [];
    let subtotal = 0;
    let totalSavings = 0;

    // Process cart items from request
    if (cartItems && cartItems.length > 0) {
      console.log('🛒 Processing cart items from request:', cartItems);
      
      for (const cartItem of cartItems) {
        try {
          // Find product in database
          const product = await Product.findById(cartItem.productId)
            .select('name price wholesalePrice wholesaleEnabled stock moq images')
            .lean();
          
          if (!product) {
            return res.status(400).json({
              success: false,
              message: `Product ${cartItem.productId} not found`
            });
          }

          // Check stock availability
          if (cartItem.quantity > product.stock) {
            return res.status(400).json({
              success: false,
              message: `Only ${product.stock} available for ${product.name}`
            });
          }

          // Calculate pricing
          const isWholesale = product.wholesaleEnabled && cartItem.quantity >= (product.moq || 1);
          const currentPrice = isWholesale ? product.wholesalePrice : product.price;
          const itemSubtotal = currentPrice * cartItem.quantity;
          const savings = isWholesale ? (product.price - product.wholesalePrice) * cartItem.quantity : 0;

          subtotal += itemSubtotal;
          totalSavings += savings;

          orderItems.push({
            productId: product._id,
            name: product.name,
            image: product.images?.[0]?.url || '',
            quantity: cartItem.quantity,
            price: currentPrice,
            pricingTier: isWholesale ? 'wholesale' : 'retail'
          });

        } catch (error) {
          console.error('Error processing cart item:', error);
          return res.status(400).json({
            success: false,
            message: `Error processing item: ${error.message}`
          });
        }
      }
    } else {
      // Fallback: Get cart items from database (original logic)
      console.log('🛒 No cart items in request, querying database...');
      const dbCartItems = await CartProduct.find({ userId })
        .populate('productId', 'name price wholesalePrice wholesaleEnabled stock moq images')
        .lean();

      if (!dbCartItems || dbCartItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty'
        });
      }

      for (const cartItem of dbCartItems) {
        const product = cartItem.productId;
        
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product not found for cart item ${cartItem._id}`
          });
        }

        // Check stock availability
        if (cartItem.quantity > product.stock) {
          return res.status(400).json({
            success: false,
            message: `Only ${product.stock} available for ${product.name}`
          });
        }

        // Calculate pricing
        const isWholesale = product.wholesaleEnabled && cartItem.quantity >= (product.moq || 1);
        const currentPrice = isWholesale ? product.wholesalePrice : product.price;
        const itemSubtotal = currentPrice * cartItem.quantity;
        const savings = isWholesale ? (product.price - product.wholesalePrice) * cartItem.quantity : 0;

        subtotal += itemSubtotal;
        totalSavings += savings;

        orderItems.push({
          productId: product._id,
          name: product.name,
          image: product.images?.[0]?.url || '',
          quantity: cartItem.quantity,
          price: currentPrice,
          pricingTier: isWholesale ? 'wholesale' : 'retail'
        });
      }
    }

    // Calculate shipping (free over ₦50,000)
    const shipping = subtotal > 50000 ? 0 : 5000;
    const total = subtotal + shipping;

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create order
    const order = new Order({
      userId,
      orderId,
      items: orderItems,
      delivery_address,
      subtotal,
      shipping,
      total,
      totalSavings,
      payment_method,
      payment_status: payment_method === 'cod' ? 'pending' : 'pending',
      notes,
      order_status: 'pending'
    });

    // Handle Paystack payment
    if (payment_method === 'card' && payment_reference) {
      try {
        const verifyResponse = await axios.get(
          `https://api.paystack.co/transaction/verify/${payment_reference}`,
          {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
            timeout: 5000
          }
        );

        const paymentData = verifyResponse.data.data;
        
        if (paymentData.status === 'success') {
          const amountInNaira = paymentData.amount / 100;
          if (Math.abs(amountInNaira - total) > 1) {
            return res.status(400).json({
              success: false,
              message: 'Payment amount mismatch'
            });
          }

          order.payment_status = 'paid';
          order.payment_reference = payment_reference;

          // Update stock in background
          Product.bulkWrite(
            orderItems.map(item => ({
              updateOne: {
                filter: { _id: item.productId },
                update: { $inc: { stock: -item.quantity } }
              }
            }))
          ).catch(console.error);
        }
      } catch (error) {
        console.error('Paystack verification failed:', error.message);
        // Continue without verification for now
      }
    }

    // Save order
    await order.save();

    // Clear cart from database if we used database cart
    if (!cartItems || cartItems.length === 0) {
      CartProduct.deleteMany({ userId }).catch(console.error);
    }

    // Return response
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.orderId,
        total: order.total,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        created_at: order.createdAt,
        items: order.items.length
      }
    });

    // Send emails in background
    sendOrderEmailsInBackground(order, req.user);

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// Background email function
const sendOrderEmailsInBackground = async (order, user) => {
    try {
        // Don't await, let it run in background
        sendOrderEmailNotification(order, user);
    } catch (error) {
        console.error('Background email error:', error);
    }
};

// Function to send email notification
const sendOrderEmailNotification = async (order, user) => {
    try {
        // Get all admin users
        const adminUsers = await User.find({ role: 'admin' });
        
        // Send email to each admin
        for (const admin of adminUsers) {
            await sendEmail({
                sendTo: admin.email,
                subject: `New Order Received - ${order.orderId}`,
                html: orderNotificationTemplate({
                    orderId: order.orderId,
                    customerName: user.name,
                    customerEmail: user.email,
                    orderTotal: `₦${order.total.toLocaleString()}`,
                    itemsCount: order.items.length,
                    orderDate: new Date(order.createdAt).toLocaleDateString('en-NG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                })
            });
        }
        
        // Also send confirmation email to customer
        await sendEmail({
            sendTo: user.email,
            subject: `Order Confirmation - ${order.orderId}`,
            html: orderConfirmationTemplate({
                orderId: order.orderId,
                customerName: user.name,
                orderTotal: `₦${order.total.toLocaleString()}`,
                paymentMethod: order.payment_method === 'cod' ? 'Cash on Delivery' : 'Card Payment',
                orderDate: new Date(order.createdAt).toLocaleDateString('en-NG', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            })
        });
        
        console.log('Order notification emails sent successfully');
    } catch (emailError) {
        console.error('Failed to send order notification emails:', emailError);
    }
};

// Verify Paystack payment


// Add these email templates to your sendEmail.js file
export const orderNotificationTemplate = ({ orderId, customerName, customerEmail, orderTotal, itemsCount, orderDate }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ff8dc1; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .order-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Order Notification</h1>
        </div>
        <div class="content">
            <h2>Hello Admin,</h2>
            <p>A new order has been placed on your store!</p>
            
            <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Customer:</strong> ${customerName}</p>
                <p><strong>Email:</strong> ${customerEmail}</p>
                <p><strong>Total Amount:</strong> ${orderTotal}</p>
                <p><strong>Number of Items:</strong> ${itemsCount}</p>
                <p><strong>Order Date:</strong> ${orderDate}</p>
            </div>
            
            <p>Please log in to the admin panel to view and process this order.</p>
            
            <p><strong>Action Required:</strong> Review and update order status</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Pepe's Brunch and Cafe. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

export const orderConfirmationTemplate = ({ orderId, customerName, orderTotal, paymentMethod, orderDate }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .thank-you { text-align: center; margin: 20px 0; font-size: 18px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Order Confirmation</h1>
        </div>
        <div class="content">
            <h2>Hello ${customerName},</h2>
            <p>Thank you for your order! We have received your order and will begin processing it shortly.</p>
            
            <div class="thank-you">
                <h3>Your Order Details</h3>
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Order Total:</strong> ${orderTotal}</p>
                <p><strong>Payment Method:</strong> ${paymentMethod}</p>
                <p><strong>Order Date:</strong> ${orderDate}</p>
            </div>
            
            <p>You will receive another email once your order has been shipped.</p>
            <p>If you have any questions, please contact our customer support.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Pepe's Brunch and Cafe. All rights reserved.</p>
        </div>
</body>
</html>
`;




export const verifyPaystackPayment = async (req, res) => {
    try {
        const { reference } = req.body;
        
        if (!reference) {
            return res.status(400).json({
                success: false,
                message: 'Payment reference is required'
            });
        }

        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
                }
            }
        );

        const paymentData = response.data.data;
        
        if (paymentData.status === 'success') {
            return res.json({
                success: true,
                message: 'Payment verified successfully',
                data: {
                    reference: paymentData.reference,
                    amount: paymentData.amount / 100, // Convert from kobo to Naira
                    status: paymentData.status,
                    paidAt: paymentData.paid_at,
                    channel: paymentData.channel,
                    currency: paymentData.currency
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Payment not successful',
                data: paymentData
            });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Payment verification failed',
            error: error.message
        });
    }
};

 


export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;

        const orders = await Order.find({ userId })
            .populate('delivery_address')
            .populate('items.productId')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// Get single order
export const getOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({ orderId, userId })
            .populate('delivery_address')
            .populate('items.productId');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
};

// Update order status (for admin)
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { order_status } = req.body;

        const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
        
        if (!validStatuses.includes(order_status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order status'
            });
        }

        const order = await Order.findOneAndUpdate(
            { orderId },
            { order_status },
            { new: true }
        ).populate('delivery_address').populate('items.productId');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order',
            error: error.message
        });
    }
};







// controllers/orderController.js - Updated to match productApi response pattern

// Get all orders (admin only) - following consistent response format
export const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '', status = '', type = '' } = req.query;
        
        // Build filter object
        const filter = {};
        
        if (search) {
            filter.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { 'userId.email': { $regex: search, $options: 'i' } },
                { 'delivery_address.phone': { $regex: search, $options: 'i' } },
                { 'items.name': { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status) {
            filter.order_status = status;
        }
        
        if (type === 'wholesale') {
            filter['items.pricingTier'] = 'wholesale';
        } else if (type === 'retail') {
            filter['items.pricingTier'] = 'retail';
        }

        const orders = await Order.find(filter)
            .populate('userId', 'name email')
            .populate('delivery_address')
            .populate('items.productId')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Order.countDocuments(filter);

        // Following the same response pattern as products
        return res.json({
            success: true,
            message: "Orders retrieved successfully",
            data: orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalOrders: total,
                ordersPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error("Get all orders error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

// Update order status (admin only) - consistent response format
export const updateOrderStatusAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { order_status } = req.body;

        const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
        
        if (!validStatuses.includes(order_status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        const order = await Order.findByIdAndUpdate(
            id,
            { order_status },
            { new: true }
        )
        .populate('userId', 'name email')
        .populate('delivery_address')
        .populate('items.productId');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.json({
            success: true,
            message: "Order status updated successfully",
            data: order
        });
    } catch (error) {
        console.error("Update order status error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

// Delete order (admin only) - consistent response format
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findByIdAndDelete(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.json({
            success: true,
            message: "Order deleted successfully"
        });
    } catch (error) {
        console.error("Delete order error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

// Get order statistics (admin only) - consistent response format
export const getOrderStats = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ order_status: 'pending' });
        const deliveredOrders = await Order.countDocuments({ order_status: 'delivered' });
        const wholesaleOrders = await Order.countDocuments({ 'items.pricingTier': 'wholesale' });
        
        // Get today's orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = await Order.countDocuments({ 
            createdAt: { $gte: today } 
        });

        // Get total revenue
        const revenueResult = await Order.aggregate([
            { $match: { order_status: 'delivered' } },
            { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
        ]);
        const totalRevenue = revenueResult[0]?.totalRevenue || 0;

        return res.json({
            success: true,
            message: "Order statistics retrieved successfully",
            data: {
                totalOrders,
                pendingOrders,
                deliveredOrders,
                wholesaleOrders,
                todayOrders,
                totalRevenue: parseFloat(totalRevenue.toFixed(2))
            }
        });
    } catch (error) {
        console.error("Get order stats error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};



