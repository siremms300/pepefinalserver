import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from cookies first, then from Authorization header as fallback
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        message: "Access token required",
        error: true,
        success: false
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID from the token
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false
      });
    }

    // Check if user is active
    if (user.status !== 'Active') {
      return res.status(401).json({
        message: "Your account has been suspended",
        error: true,
        success: false
      });
    }

    // Add user to request object
    req.user = user;
    req.userId = user._id;
    // req.userId = user._id.toString(); // Make sure it's a string
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: "Invalid token",
        error: true,
        success: false
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: "Token expired",
        error: true,
        success: false
      });
    }

    return res.status(500).json({
      message: "Authentication failed",
      error: true,
      success: false
    });
  }
};



export const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};



