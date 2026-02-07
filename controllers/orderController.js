
import Order from '../models/orderModel.js';
import CartProduct from '../models/cartProductModel.js';
import Product from '../models/productModel.js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { sendEmail } from '../config/sendEmail.js';
import User from '../models/userModel.js';

// Paystack initialization
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;


// controllers/orderController.js - Updated createOrder function
// export const createOrder = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { 
//       delivery_address, 
//       payment_method = 'cod', 
//       notes = '', 
//       payment_reference,
//       cartItems // Accept cart items from frontend request
//     } = req.body;

//     // Quick validation
//     if (!delivery_address) {
//       return res.status(400).json({
//         success: false,
//         message: 'Delivery address required'
//       });
//     }

//     let orderItems = [];
//     let subtotal = 0;
//     let totalSavings = 0;

//     // Process cart items from request
//     if (cartItems && cartItems.length > 0) {
//       console.log('🛒 Processing cart items from request:', cartItems);
      
//       for (const cartItem of cartItems) {
//         try {
//           // Find product in database
//           const product = await Product.findById(cartItem.productId)
//             .select('name price wholesalePrice wholesaleEnabled stock moq images')
//             .lean();
          
//           if (!product) {
//             return res.status(400).json({
//               success: false,
//               message: `Product ${cartItem.productId} not found`
//             });
//           }

//           // Check stock availability
//           if (cartItem.quantity > product.stock) {
//             return res.status(400).json({
//               success: false,
//               message: `Only ${product.stock} available for ${product.name}`
//             });
//           }

//           // Calculate pricing
//           const isWholesale = product.wholesaleEnabled && cartItem.quantity >= (product.moq || 1);
//           const currentPrice = isWholesale ? product.wholesalePrice : product.price;
//           const itemSubtotal = currentPrice * cartItem.quantity;
//           const savings = isWholesale ? (product.price - product.wholesalePrice) * cartItem.quantity : 0;

//           subtotal += itemSubtotal;
//           totalSavings += savings;

//           orderItems.push({
//             productId: product._id,
//             name: product.name,
//             image: product.images?.[0]?.url || '',
//             quantity: cartItem.quantity,
//             price: currentPrice,
//             pricingTier: isWholesale ? 'wholesale' : 'retail'
//           });

//         } catch (error) {
//           console.error('Error processing cart item:', error);
//           return res.status(400).json({
//             success: false,
//             message: `Error processing item: ${error.message}`
//           });
//         }
//       }
//     } else {
//       // Fallback: Get cart items from database (original logic)
//       console.log('🛒 No cart items in request, querying database...');
//       const dbCartItems = await CartProduct.find({ userId })
//         .populate('productId', 'name price wholesalePrice wholesaleEnabled stock moq images')
//         .lean();

//       if (!dbCartItems || dbCartItems.length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: 'Cart is empty'
//         });
//       }

//       for (const cartItem of dbCartItems) {
//         const product = cartItem.productId;
        
//         if (!product) {
//           return res.status(400).json({
//             success: false,
//             message: `Product not found for cart item ${cartItem._id}`
//           });
//         }

//         // Check stock availability
//         if (cartItem.quantity > product.stock) {
//           return res.status(400).json({
//             success: false,
//             message: `Only ${product.stock} available for ${product.name}`
//           });
//         }

//         // Calculate pricing
//         const isWholesale = product.wholesaleEnabled && cartItem.quantity >= (product.moq || 1);
//         const currentPrice = isWholesale ? product.wholesalePrice : product.price;
//         const itemSubtotal = currentPrice * cartItem.quantity;
//         const savings = isWholesale ? (product.price - product.wholesalePrice) * cartItem.quantity : 0;

//         subtotal += itemSubtotal;
//         totalSavings += savings;

//         orderItems.push({
//           productId: product._id,
//           name: product.name,
//           image: product.images?.[0]?.url || '',
//           quantity: cartItem.quantity,
//           price: currentPrice,
//           pricingTier: isWholesale ? 'wholesale' : 'retail'
//         });
//       }
//     }

//     // Calculate shipping (free over ₦50,000)
//     const shipping = subtotal > 50000 ? 0 : 5000;
//     const total = subtotal + shipping;

//     // Generate order ID
//     const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

//     // Create order
//     const order = new Order({
//       userId,
//       orderId,
//       items: orderItems,
//       delivery_address,
//       subtotal,
//       shipping,
//       total,
//       totalSavings,
//       payment_method,
//       payment_status: payment_method === 'cod' ? 'pending' : 'pending',
//       notes,
//       order_status: 'pending'
//     });

//     // Handle Paystack payment
//     if (payment_method === 'card' && payment_reference) {
//       try {
//         const verifyResponse = await axios.get(
//           `https://api.paystack.co/transaction/verify/${payment_reference}`,
//           {
//             headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
//             timeout: 5000
//           }
//         );

//         const paymentData = verifyResponse.data.data;
        
//         if (paymentData.status === 'success') {
//           const amountInNaira = paymentData.amount / 100;
//           if (Math.abs(amountInNaira - total) > 1) {
//             return res.status(400).json({
//               success: false,
//               message: 'Payment amount mismatch'
//             });
//           }

//           order.payment_status = 'paid';
//           order.payment_reference = payment_reference;

//           // Update stock in background
//           Product.bulkWrite(
//             orderItems.map(item => ({
//               updateOne: {
//                 filter: { _id: item.productId },
//                 update: { $inc: { stock: -item.quantity } }
//               }
//             }))
//           ).catch(console.error);
//         }
//       } catch (error) {
//         console.error('Paystack verification failed:', error.message);
//         // Continue without verification for now
//       }
//     }

//     // Save order
//     await order.save();

//     // Clear cart from database if we used database cart
//     if (!cartItems || cartItems.length === 0) {
//       CartProduct.deleteMany({ userId }).catch(console.error);
//     }

//     // Return response
//     res.status(201).json({
//       success: true,
//       message: 'Order created successfully',
//       data: {
//         orderId: order.orderId,
//         total: order.total,
//         payment_method: order.payment_method,
//         payment_status: order.payment_status,
//         created_at: order.createdAt,
//         items: order.items.length
//       }
//     });

//     // Send emails in background
//     sendOrderEmailsInBackground(order, req.user);

//   } catch (error) {
//     console.error('Create order error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error creating order',
//       error: error.message
//     });
//   }
// };

// controllers/orderController.js - Updated createOrder function
export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      delivery_address, 
      delivery_location = 'pickup', // Add this
      payment_method = 'cod', 
      notes = '', 
      payment_reference,
      cartItems // Accept cart items from frontend request
    } = req.body;

    // Quick validation
    if (!delivery_address && delivery_location !== 'pickup') {
      return res.status(400).json({
        success: false,
        message: 'Delivery address required for delivery orders'
      });
    }

    if (!delivery_location || !['pickup', 'within_barnawa', 'outside_barnawa'].includes(delivery_location)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery location. Must be pickup, within_barnawa, or outside_barnawa'
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
            .select('name price wholesalePrice wholesaleEnabled stock moq images deliverySettings')
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
            pricingTier: isWholesale ? 'wholesale' : 'retail',
            deliverySettings: product.deliverySettings || {
              withinBarnawa: { enabled: true, price: 0, freeThreshold: 0 },
              outsideBarnawa: { enabled: true, price: 0, freeThreshold: 0 },
              pickupEnabled: true
            }
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
        .populate('productId', 'name price wholesalePrice wholesaleEnabled stock moq images deliverySettings')
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
          pricingTier: isWholesale ? 'wholesale' : 'retail',
          deliverySettings: product.deliverySettings || {
            withinBarnawa: { enabled: true, price: 0, freeThreshold: 0 },
            outsideBarnawa: { enabled: true, price: 0, freeThreshold: 0 },
            pickupEnabled: true
          }
        });
      }
    }

    // Calculate shipping based on location
    let shipping = 0;
    
    // Get delivery settings from system
    const settings = await DeliverySettings.findOne();
    const defaultPrices = settings?.defaultDeliveryPrices || {
      withinBarnawa: { price: 800, freeThreshold: 500000 },
      outsideBarnawa: { price: 1200, freeThreshold: 1000000 }
    };
    
    // Check if order qualifies for free delivery based on product-specific settings
    let shouldChargeDelivery = true;
    
    if (delivery_location === 'within_barnawa') {
      if (subtotal < defaultPrices.withinBarnawa.freeThreshold) {
        shipping = defaultPrices.withinBarnawa.price;
      } else {
        shouldChargeDelivery = false;
      }
       
      // Check if any product has specific withinBarnawa settings
      orderItems.forEach(item => {
        if (item.deliverySettings?.withinBarnawa?.enabled === false) {
          throw new Error(`${item.name} cannot be delivered within Barnawa`);
        }
      });
      
    } else if (delivery_location === 'outside_barnawa') {
      if (subtotal < defaultPrices.outsideBarnawa.freeThreshold) {
        shipping = defaultPrices.outsideBarnawa.price;
      } else {
        shouldChargeDelivery = false;
      }
      
      // Check if any product has specific outsideBarnawa settings
      orderItems.forEach(item => {
        if (item.deliverySettings?.outsideBarnawa?.enabled === false) {
          throw new Error(`${item.name} cannot be delivered outside Barnawa`);
        }
      });
      
    } else if (delivery_location === 'pickup') {
      shipping = 0;
      shouldChargeDelivery = false;
      
      // Check if any product has pickup disabled
      orderItems.forEach(item => {
        if (item.deliverySettings?.pickupEnabled === false) {
          throw new Error(`${item.name} is not available for pickup`);
        }
      });
    }

    const total = subtotal + shipping;

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create order
    const order = new Order({
      userId,
      orderId,
      items: orderItems,
      delivery_address: delivery_location === 'pickup' ? null : delivery_address,
      delivery_location,
      subtotal,
      shipping,
      total,
      totalSavings,
      payment_method,
      payment_status: payment_method === 'cod' ? 'pending' : 'pending',
      notes,
      order_status: 'pending',
      // Add delivery specific fields
      delivery_info: {
        location: delivery_location,
        fee: shipping,
        free_delivery_threshold: delivery_location === 'within_barnawa' 
          ? defaultPrices.withinBarnawa.freeThreshold 
          : delivery_location === 'outside_barnawa'
            ? defaultPrices.outsideBarnawa.freeThreshold
            : 0,
        qualifies_for_free_delivery: !shouldChargeDelivery
      }
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
          
          // Allow small difference due to rounding
          if (Math.abs(amountInNaira - total) > 1) {
            return res.status(400).json({
              success: false,
              message: `Payment amount mismatch. Expected: ₦${total}, Received: ₦${amountInNaira}`
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
        subtotal: order.subtotal,
        shipping: order.shipping,
        delivery_location: order.delivery_location,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        created_at: order.createdAt,
        items: order.items.length,
        delivery_info: order.delivery_info
      }
    });

    // Send emails in background
    sendOrderEmailsInBackground(order, req.user);

  } catch (error) {
    console.error('Create order error:', error);
    
    // Handle specific errors
    if (error.message.includes('cannot be delivered') || error.message.includes('not available for pickup')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};




// Update the order notification function in your orderController.js

// Function to send email notification
const sendOrderEmailNotification = async (order, user) => {
    try {
        // Get all admin users
        const adminUsers = await User.find({ role: 'admin' });
        
        // Send email to each admin
        for (const admin of adminUsers) {
            await sendEmail({
                sendTo: admin.email,
                subject: `🎉 New Order #${order.orderId} - ${user.name}`,
                html: orderNotificationTemplate({
                    orderId: order.orderId,
                    customerName: user.name,
                    customerEmail: user.email,
                    customerPhone: order.delivery_address?.phone || 'Not provided',
                    orderTotal: `₦${order.total.toLocaleString()}`,
                    subtotal: `₦${order.subtotal.toLocaleString()}`,
                    shipping: `₦${order.shipping.toLocaleString()}`,
                    totalSavings: `₦${order.totalSavings.toLocaleString()}`,
                    items: order.items,
                    itemsCount: order.items.length,
                    orderDate: new Date(order.createdAt).toLocaleDateString('en-NG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    deliveryAddress: order.delivery_address,
                    paymentMethod: order.payment_method === 'cod' ? 'Cash on Delivery' : 
                                  order.payment_method === 'card' ? 'Card Payment' : 
                                  order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1),
                    paymentStatus: order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1),
                    orderStatus: order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1),
                    notes: order.notes || 'No special instructions'
                })
            });
        }
        
        // Also send confirmation email to customer (with simpler template)
        await sendEmail({
            sendTo: user.email,
            subject: `✅ Order Confirmation #${order.orderId}`,
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
                }),
                items: order.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: `₦${item.price.toLocaleString()}`,
                    subtotal: `₦${(item.price * item.quantity).toLocaleString()}`
                }))
            })
        });
        
        console.log('Order notification emails sent successfully');
    } catch (emailError) {
        console.error('Failed to send order notification emails:', emailError);
    }
};

// Update the orderNotificationTemplate to include all details
export const orderNotificationTemplate = ({ 
    orderId, 
    customerName, 
    customerEmail, 
    customerPhone,
    orderTotal, 
    subtotal,
    shipping,
    totalSavings,
    items, 
    itemsCount, 
    orderDate,
    deliveryAddress,
    paymentMethod,
    paymentStatus,
    orderStatus,
    notes
}) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Order #${orderId}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 700px;
            margin: 0 auto;
            background: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #ff8dc1, #ff6b9d);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header .order-id {
            font-size: 18px;
            opacity: 0.9;
            margin-top: 5px;
        }
        .content {
            padding: 40px;
        }
        .section {
            margin-bottom: 30px;
            padding: 25px;
            background: #f9f9f9;
            border-radius: 10px;
            border-left: 4px solid #ff8dc1;
        }
        .section-title {
            color: #ff6b9d;
            margin-top: 0;
            margin-bottom: 20px;
            font-size: 20px;
            font-weight: 600;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .info-item {
            margin-bottom: 12px;
        }
        .info-label {
            font-weight: 600;
            color: #555;
            display: block;
            margin-bottom: 4px;
            font-size: 14px;
        }
        .info-value {
            color: #222;
            font-size: 16px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .items-table th {
            background: #ff8dc1;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }
        .items-table td {
            padding: 15px;
            border-bottom: 1px solid #eee;
        }
        .items-table tr:last-child td {
            border-bottom: none;
        }
        .items-table tr:hover {
            background: #fff5f9;
        }
        .pricing-summary {
            background: #fff5f9;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
        }
        .pricing-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px dashed #ddd;
        }
        .pricing-row:last-child {
            border-bottom: none;
            font-weight: 700;
            font-size: 18px;
            color: #ff6b9d;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-paid { background: #d4edda; color: #155724; }
        .status-delivered { background: #d1ecf1; color: #0c5460; }
        .footer {
            text-align: center;
            padding: 25px;
            background: #f8f9fa;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #eee;
        }
        .footer a {
            color: #ff6b9d;
            text-decoration: none;
        }
        .urgent-note {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            text-align: center;
            font-weight: 600;
        }
        .address-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #eee;
            margin-top: 10px;
        }
        @media (max-width: 600px) {
            .content {
                padding: 20px;
            }
            .section {
                padding: 20px;
            }
            .info-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 New Order Received!</h1>
            <div class="order-id">Order #${orderId}</div>
        </div>
        
        <div class="content">
            <div class="urgent-note">
                ⚡ New order requires your attention! Please process within 24 hours.
            </div>
            
            <!-- Order Summary Section -->
            <div class="section">
                <h2 class="section-title">Order Summary</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Order ID</span>
                        <span class="info-value">${orderId}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Order Date & Time</span>
                        <span class="info-value">${orderDate}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Order Status</span>
                        <span class="status-badge status-${orderStatus.toLowerCase()}">${orderStatus}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Payment Status</span>
                        <span class="status-badge status-${paymentStatus.toLowerCase()}">${paymentStatus}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Amount</span>
                        <span class="info-value" style="font-weight:700;color:#ff6b9d;font-size:20px;">${orderTotal}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Items</span>
                        <span class="info-value">${itemsCount} items</span>
                    </div>
                </div>
            </div>
            
            <!-- Customer Information -->
            <div class="section">
                <h2 class="section-title">Customer Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Customer Name</span>
                        <span class="info-value">${customerName}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email Address</span>
                        <span class="info-value"><a href="mailto:${customerEmail}" style="color:#ff6b9d;">${customerEmail}</a></span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Phone Number</span>
                        <span class="info-value">${customerPhone}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Payment Method</span>
                        <span class="info-value">${paymentMethod}</span>
                    </div>
                </div>
            </div>
            
            <!-- Delivery Address -->
            <div class="section">
                <h2 class="section-title">Delivery Address</h2>
                <div class="address-box">
                    <strong>${deliveryAddress?.fullName || 'N/A'}</strong><br>
                    ${deliveryAddress?.street || ''}<br>
                    ${deliveryAddress?.city || ''}, ${deliveryAddress?.state || ''}<br>
                    ${deliveryAddress?.postalCode || ''}<br>
                    Phone: ${deliveryAddress?.phone || 'N/A'}<br>
                    ${deliveryAddress?.instructions ? `<br><strong>Delivery Instructions:</strong><br>${deliveryAddress.instructions}` : ''}
                </div>
            </div>
            
            <!-- Order Items -->
            <div class="section">
                <h2 class="section-title">Order Items (${itemsCount})</h2>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Subtotal</th>
                            <th>Pricing</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>₦${item.price.toLocaleString()}</td>
                            <td>${item.quantity}</td>
                            <td>₦${(item.price * item.quantity).toLocaleString()}</td>
                            <td>
                                <span style="display:inline-block; padding:4px 10px; background:${item.pricingTier === 'wholesale' ? '#d4edda' : '#fff3cd'}; color:${item.pricingTier === 'wholesale' ? '#155724' : '#856404'}; border-radius:12px; font-size:12px; font-weight:600;">
                                    ${item.pricingTier === 'wholesale' ? 'WHOLESALE' : 'RETAIL'}
                                </span>
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <!-- Pricing Summary -->
            <div class="section">
                <h2 class="section-title">Order Summary</h2>
                <div class="pricing-summary">
                    <div class="pricing-row">
                        <span>Subtotal:</span>
                        <span>${subtotal}</span>
                    </div>
                    <div class="pricing-row">
                        <span>Shipping Fee:</span>
                        <span>${shipping}</span>
                    </div>
                    ${totalSavings !== '₦0' ? `
                    <div class="pricing-row" style="color:#28a745;">
                        <span>Total Savings:</span>
                        <span>-${totalSavings}</span>
                    </div>
                    ` : ''}
                    <div class="pricing-row">
                        <span><strong>Total Amount:</strong></span>
                        <span><strong>${orderTotal}</strong></span>
                    </div>
                </div>
            </div>
            
            <!-- Additional Notes -->
            ${notes !== 'No special instructions' ? `
            <div class="section">
                <h2 class="section-title">Customer Notes</h2>
                <div style="background:#fff5f9; padding:15px; border-radius:6px;">
                    <p style="margin:0; font-style:italic;">"${notes}"</p>
                </div>
            </div>
            ` : ''}
            
            <!-- Action Required -->
            <div class="section" style="background:#f8f9fa; text-align:center;">
                <h2 class="section-title" style="color:#dc3545;">Action Required</h2>
                <p style="margin-bottom:20px;">Please take action on this order within 24 hours:</p>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:10px; max-width:500px; margin:0 auto;">
                    <a href="#" style="display:block; background:#28a745; color:white; padding:12px; border-radius:6px; text-decoration:none; font-weight:600;">Process Order</a>
                    <a href="#" style="display:block; background:#007bff; color:white; padding:12px; border-radius:6px; text-decoration:none; font-weight:600;">View Details</a>
                    <a href="#" style="display:block; background:#6c757d; color:white; padding:12px; border-radius:6px; text-decoration:none; font-weight:600;">Contact Customer</a>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>This email was automatically generated by <strong>Pepe's Brunch and Cafe</strong> order management system.</p>
            <p>© ${new Date().getFullYear()} Pepe's Brunch and Cafe. All rights reserved.</p>
            <p>Need help? <a href="mailto:support@pepesbrunch.com">Contact Support</a></p>
        </div>
    </div>
</body>
</html>
`;

// Update customer confirmation template as well
export const orderConfirmationTemplate = ({ 
    orderId, 
    customerName, 
    orderTotal, 
    paymentMethod, 
    orderDate,
    items 
}) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation #${orderId}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: #10b981; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .order-summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .items-list { margin: 15px 0; }
        .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .item:last-child { border-bottom: none; }
        .footer { text-align: center; padding: 20px; background: #f8f9fa; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Order Confirmation</h1>
            <p>Thank you for your order!</p>
        </div>
        <div class="content">
            <h2>Hello ${customerName},</h2>
            <p>Your order has been received and is being processed. Here are your order details:</p>
            
            <div class="order-summary">
                <h3>Order #${orderId}</h3>
                <p><strong>Order Date:</strong> ${orderDate}</p>
                <p><strong>Total Amount:</strong> ${orderTotal}</p>
                <p><strong>Payment Method:</strong> ${paymentMethod}</p>
            </div>
            
            <h3>Order Items:</h3>
            <div class="items-list">
                ${items.map(item => `
                <div class="item">
                    <span>${item.name} (x${item.quantity})</span>
                    <span>${item.subtotal}</span>
                </div>
                `).join('')}
            </div>
            
            <p>You will receive another email once your order has been shipped.</p>
            <p>If you have any questions, please contact our customer support.</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Pepe's Brunch and Cafe. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;









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
// const sendOrderEmailNotification = async (order, user) => {
//     try {
//         // Get all admin users
//         const adminUsers = await User.find({ role: 'admin' });
        
//         // Send email to each admin
//         for (const admin of adminUsers) {
//             await sendEmail({
//                 sendTo: admin.email,
//                 subject: `New Order Received - ${order.orderId}`,
//                 html: orderNotificationTemplate({
//                     orderId: order.orderId,
//                     customerName: user.name,
//                     customerEmail: user.email,
//                     orderTotal: `₦${order.total.toLocaleString()}`,
//                     itemsCount: order.items.length,
//                     orderDate: new Date(order.createdAt).toLocaleDateString('en-NG', {
//                         weekday: 'long',
//                         year: 'numeric',
//                         month: 'long',
//                         day: 'numeric',
//                         hour: '2-digit',
//                         minute: '2-digit'
//                     })
//                 })
//             });
//         }
        
//         // Also send confirmation email to customer
//         await sendEmail({
//             sendTo: user.email,
//             subject: `Order Confirmation - ${order.orderId}`,
//             html: orderConfirmationTemplate({
//                 orderId: order.orderId,
//                 customerName: user.name,
//                 orderTotal: `₦${order.total.toLocaleString()}`,
//                 paymentMethod: order.payment_method === 'cod' ? 'Cash on Delivery' : 'Card Payment',
//                 orderDate: new Date(order.createdAt).toLocaleDateString('en-NG', {
//                     weekday: 'long',
//                     year: 'numeric',
//                     month: 'long',
//                     day: 'numeric',
//                     hour: '2-digit',
//                     minute: '2-digit'
//                 })
//             })
//         });
        
//         console.log('Order notification emails sent successfully');
//     } catch (emailError) {
//         console.error('Failed to send order notification emails:', emailError);
//     }
// };

// Verify Paystack payment


// Add these email templates to your sendEmail.js file
// export const orderNotificationTemplate = ({ orderId, customerName, customerEmail, orderTotal, itemsCount, orderDate }) => `
// <!DOCTYPE html>
// <html>
// <head>
//     <meta charset="UTF-8">
//     <style>
//         body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//         .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//         .header { background: #ff8dc1; color: white; padding: 20px; text-align: center; }
//         .content { background: #f9f9f9; padding: 30px; }
//         .order-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
//         .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
//     </style>
// </head>
// <body>
//     <div class="container">
//         <div class="header">
//             <h1>New Order Notification</h1>
//         </div>
//         <div class="content">
//             <h2>Hello Admin,</h2>
//             <p>A new order has been placed on your store!</p>
            
//             <div class="order-details">
//                 <h3>Order Details</h3>
//                 <p><strong>Order ID:</strong> ${orderId}</p>
//                 <p><strong>Customer:</strong> ${customerName}</p>
//                 <p><strong>Email:</strong> ${customerEmail}</p>
//                 <p><strong>Total Amount:</strong> ${orderTotal}</p>
//                 <p><strong>Number of Items:</strong> ${itemsCount}</p>
//                 <p><strong>Order Date:</strong> ${orderDate}</p>
//             </div>
            
//             <p>Please log in to the admin panel to view and process this order.</p>
            
//             <p><strong>Action Required:</strong> Review and update order status</p>
//         </div>
//         <div class="footer">
//             <p>&copy; ${new Date().getFullYear()} Pepe's Brunch and Cafe. All rights reserved.</p>
//         </div>
//     </div>
// </body>
// </html>
// `;

// export const orderConfirmationTemplate = ({ orderId, customerName, orderTotal, paymentMethod, orderDate }) => `
// <!DOCTYPE html>
// <html>
// <head>
//     <meta charset="UTF-8">
//     <style>
//         body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//         .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//         .header { background: #10b981; color: white; padding: 20px; text-align: center; }
//         .content { background: #f9f9f9; padding: 30px; }
//         .thank-you { text-align: center; margin: 20px 0; font-size: 18px; }
//         .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
//     </style>
// </head>
// <body>
//     <div class="container">
//         <div class="header">
//             <h1>Order Confirmation</h1>
//         </div>
//         <div class="content">
//             <h2>Hello ${customerName},</h2>
//             <p>Thank you for your order! We have received your order and will begin processing it shortly.</p>
            
//             <div class="thank-you">
//                 <h3>Your Order Details</h3>
//                 <p><strong>Order ID:</strong> ${orderId}</p>
//                 <p><strong>Order Total:</strong> ${orderTotal}</p>
//                 <p><strong>Payment Method:</strong> ${paymentMethod}</p>
//                 <p><strong>Order Date:</strong> ${orderDate}</p>
//             </div>
            
//             <p>You will receive another email once your order has been shipped.</p>
//             <p>If you have any questions, please contact our customer support.</p>
//         </div>
//         <div class="footer">
//             <p>&copy; ${new Date().getFullYear()} Pepe's Brunch and Cafe. All rights reserved.</p>
//         </div>
// </body>
// </html>
// `;




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



