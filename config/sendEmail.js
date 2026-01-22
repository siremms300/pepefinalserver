// servers/config/sendEmail.js


import nodemailer from 'nodemailer';

// Create transporter 
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS 
    }
});

// Verify transporter connection   
transporter.verify((error, success) => {
    if (error) {
        console.error('SMTP connection error:', error);
    } else {
        console.log('SMTP server is ready to send emails');
    }
});

// Email sending function
export const sendEmail = async ({ sendTo, subject, html, text }) => {
    try {
        const mailOptions = {
            from: {
                name: process.env.SMTP_FROM_NAME || 'Pepes Brunch and Cafe',
                address: process.env.SMTP_FROM_EMAIL || 'siremms300@gmail.com'
            },
            to: sendTo,
            subject: subject,
            html: html,
            text: text || html.replace(/<[^>]*>/g, '') // Fallback text version
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to: ${sendTo}, Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw new Error('Failed to send email');
    }
};

// Email templates
export const verifyEmailTemplate = ({ name, url }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
        }
        .footer { 
            text-align: center; 
            margin-top: 20px; 
            color: #666; 
            font-size: 14px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Verification</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for registering with Pepe's Brunch and Cafe! Please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
                <a href="${url}" class="button" style="color: #f5f0f0;">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${url}</p>
            
            <p><strong>This verification link will expire in 24 hours.</strong></p>
            
            <p>If you didn't create an account with us, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Pepe's Brunch and Cafe. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

export const passwordResetTemplate = ({ name, url }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #dc3545; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
        }
        .footer { 
            text-align: center; 
            margin-top: 20px; 
            color: #666; 
            font-size: 14px; 
        }
        .warning { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password for your Pepe's Brunch and Cafe account.</p>
            
            <div class="warning">
                <p><strong>Important:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
            </div>
            
            <p>To reset your password, click the button below:</p>
            
            <div style="text-align: center;">
                <a href="${url}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #dc3545;">${url}</p>
            
            <p><strong>This password reset link will expire in 1 hour.</strong></p>
            
            <p>For security reasons, we recommend that you:</p>
            <ul>
                <li>Choose a strong, unique password</li>
                <li>Never share your password with anyone</li>
                <li>Enable two-factor authentication if available</li>
            </ul>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Pepe's Brunch and Cafe. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

// Additional template for general notifications
export const welcomeEmailTemplate = ({ name }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Pepe's Brunch and Cafe!</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>Welcome to Pepe's Brunch and Cafe! We're excited to have you on board.</p>
            <p>Your account has been successfully created and is ready to use.</p>
            
            <p>Here's what you can do now:</p>
            <ul>
                <li>Browse our products and services</li>
                <li>Complete your profile</li>
                <li>Start shopping!</li>
            </ul>
            
            <p>If you have any questions, feel free to contact our support team.</p>
            
            <p>Happy shopping!</p>
            <p><strong>Pepe's Brunch and Cafe Team</strong></p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Pepe's Brunch and Cafe. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

// Test email function
export const testEmail = async () => {
    try {
        await sendEmail({
            sendTo: process.env.SMTP_TEST_EMAIL,
            subject: 'Test Email from Pepes Brunch and Cafe',
            html: '<h1>Test Email</h1><p>This is a test email from Pepes Brunch and Cafe server.</p>'
        });
        console.log('Test email sent successfully');
    } catch (error) {
        console.error('Test email failed:', error);
    }
};



// Add this template function
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
        .order-details { 
            background: white; 
            padding: 20px; 
            border-radius: 5px; 
            margin: 20px 0;
            border-left: 4px solid #ff8dc1;
        }
        .footer { 
            text-align: center; 
            margin-top: 20px; 
            color: #666; 
            font-size: 14px; 
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        .highlight {
            color: #ff8dc1;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛍️ New Order Received</h1>
        </div>
        <div class="content">
            <h2>Hello Admin,</h2>
            <p>A new order has been placed on <span class="highlight">Pepe's Brunch and Cafe</span>!</p>
            
            <div class="order-details">
                <h3>📋 Order Summary</h3>
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Customer Name:</strong> ${customerName}</p>
                <p><strong>Customer Email:</strong> ${customerEmail}</p>
                <p><strong>Total Amount:</strong> ₦${orderTotal}</p>
                <p><strong>Number of Items:</strong> ${itemsCount}</p>
                <p><strong>Order Date & Time:</strong> ${orderDate}</p>
            </div>
            
            <p>⚠️ <strong>Action Required:</strong> Please log in to the admin panel to:</p>
            <ul>
                <li>Review order details</li>
                <li>Update order status</li>
                <li>Prepare for delivery</li>
            </ul>
            
            <p>
                <a href="${process.env.ADMIN_URL || 'http://localhost:5173/admin'}/orders" 
                   style="background: #ff8dc1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    👉 View Order in Admin Panel
                </a>
            </p>
        </div>
        <div class="footer">
            <p>This is an automated notification from Pepe's Brunch and Cafe Order System</p>
            <p>&copy; ${new Date().getFullYear()} Pepe's Brunch and Cafe. All rights reserved.</p>
        </div>
</body>
</html>
`;

// Add order confirmation template for customers
export const orderConfirmationTemplate = ({ orderId, customerName, orderTotal, paymentMethod, orderDate, deliveryAddress }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .order-info { 
            background: white; 
            padding: 20px; 
            border-radius: 5px; 
            margin: 20px 0;
            border-left: 4px solid #10b981;
        }
        .thank-you { 
            text-align: center; 
            margin: 20px 0; 
            font-size: 18px;
            color: #10b981;
        }
        .footer { 
            text-align: center; 
            margin-top: 20px; 
            color: #666; 
            font-size: 14px; 
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        .highlight {
            color: #10b981;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Order Confirmation</h1>
        </div>
        <div class="content">
            <h2>Dear ${customerName},</h2>
            <p>Thank you for your order at <span class="highlight">Pepe's Brunch and Cafe</span>!</p>
            
            <div class="thank-you">
                <p>Your order has been received and is being processed.</p>
            </div>
            
            <div class="order-info">
                <h3>📦 Order Details</h3>
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Order Total:</strong> ₦${orderTotal}</p>
                <p><strong>Payment Method:</strong> ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card Payment'}</p>
                <p><strong>Order Date:</strong> ${orderDate}</p>
                ${deliveryAddress ? `<p><strong>Delivery Address:</strong> ${deliveryAddress}</p>` : ''}
            </div>
            
            <h3>📋 Next Steps:</h3>
            <ol>
                <li>We'll notify you once your order is being prepared</li>
                <li>You'll receive another email when your order is shipped</li>
                <li>Track your order status in your account dashboard</li>
            </ol>
            
            <p><strong>Estimated Delivery:</strong> 1-3 business days</p>
            
            <p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders" 
                   style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    📱 Track Your Order
                </a>
            </p>
            
            <p>If you have any questions about your order, please contact our customer support.</p>
        </div>
        <div class="footer">
            <p>Pepe's Brunch and Cafe - Delivering deliciousness to your doorstep!</p>
            <p>📞 Contact: +234 123 456 7890 | ✉️ support@pepesbrunch.com</p>
            <p>&copy; ${new Date().getFullYear()} Pepe's Brunch and Cafe. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

// Add order status update template
export const orderStatusUpdateTemplate = ({ orderId, customerName, status, updateDate, trackingNumber, notes }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .status-update { 
            background: white; 
            padding: 20px; 
            border-radius: 5px; 
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
        }
        .footer { 
            text-align: center; 
            margin-top: 20px; 
            color: #666; 
            font-size: 14px; 
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            background: #3b82f6;
            color: white;
            border-radius: 20px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📦 Order Status Update</h1>
        </div>
        <div class="content">
            <h2>Dear ${customerName},</h2>
            <p>Your order status has been updated!</p>
            
            <div class="status-update">
                <h3>🔄 Status Update Details</h3>
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>New Status:</strong> <span class="status-badge">${status}</span></p>
                <p><strong>Updated On:</strong> ${updateDate}</p>
                ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
                ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            </div>
            
            <p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${orderId}" 
                   style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    🔍 View Order Details
                </a>
            </p>
        </div>
        <div class="footer">
            <p>Pepe's Brunch and Cafe - Always fresh, always delicious!</p>
            <p>&copy; ${new Date().getFullYear()} Pepe's Brunch and Cafe. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;



export default {
    sendEmail,
    verifyEmailTemplate,
    passwordResetTemplate,
    welcomeEmailTemplate,
    testEmail
};



