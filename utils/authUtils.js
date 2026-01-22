// server/utils/authUtils
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// server/utils/authUtils.js
// Add role-specific middleware


// Generate JWT Token
// export const generateToken = (userId) => {
//     return jwt.sign(
//         { userId },
//         process.env.JWT_SECRET,
//         { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
//     );
// };

// // Generate Refresh Token
// export const generateRefreshToken = (userId) => {
//     return jwt.sign(
//         { userId },
//         process.env.JWT_REFRESH_SECRET,
//         { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
//     );
// };


 

export const generateToken = (userId, role = 'user') => {
  return jwt.sign(
    { 
      userId,
      role  // Include role in the token
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const generateRefreshToken = (userId, role = 'user') => {
  return jwt.sign(
    { 
      userId,
      role  // Include role in refresh token too
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};



// Verify JWT Token
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

// Verify Refresh Token
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

// Set Cookies in Response
export const setAuthCookies = (response, token, refreshToken) => {
    response.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
};

// Clear Auth Cookies
export const clearAuthCookies = (response) => {
    response.clearCookie('token');
    response.clearCookie('refreshToken');
};

// Middleware to verify JWT and check authentication
export const authenticateToken = async (request, response, next) => {
    try {
        const token = request.cookies?.token || request.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return response.status(401).json({
                message: "Access token required",
                error: true,
                success: false
            });
        }

        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return response.status(401).json({
                message: "Invalid token - user not found",
                error: true,
                success: false
            });
        }

        if (user.status !== 'Active') {
            return response.status(401).json({
                message: "Account is not active",
                error: true,
                success: false
            });
        }

        request.user = user;
        next();
    } catch (error) {
        return response.status(401).json({
            message: "Invalid or expired token",
            error: true,
            success: false
        });
    }
};

// Middleware to check if user has specific role(s)
export const requireRole = (roles) => {
    return (request, response, next) => {
        if (!request.user) {
            return response.status(401).json({
                message: "Authentication required",
                error: true,
                success: false
            });
        }

        if (!roles.includes(request.user.role)) {
            return response.status(403).json({
                message: "Insufficient permissions. Required role: " + roles.join(', '),
                error: true,
                success: false
            });
        }

        next();
    };
};

// Specific role checkers
export const requireAdmin = requireRole(['admin']);
export const requireUser = requireRole(['user', 'admin']); // Admin can access user routes too 
export const requireRider = requireRole(['rider', 'admin']); // Admins can access rider routes 

// Check if user is owner or admin/rider
export const isOwnerOrStaff = (request, resourceUserId) => {
    if (!request.user) return false;
    
    return request.user._id.toString() === resourceUserId.toString() || 
           request.user.role === 'admin' ||
           request.user.role === 'rider';
};

// Get user from token (for optional authentication)
export const getUserFromToken = async (token) => {
    try {
        if (!token) return null;
        
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId).select('-password');
        return user;
    } catch (error) {
        return null;
    }
};

// Check if user is the owner of the resource or admin
export const isOwnerOrAdmin = (request, resourceUserId) => {
    if (!request.user) return false;
    
    return request.user._id.toString() === resourceUserId.toString() || 
           request.user.role === 'admin';
};

// Middleware to check ownership or admin role
export const requireOwnershipOrAdmin = (request, response, next) => {
    const resourceId = request.params.userId || request.params.id;
    
    if (!resourceId) {
        return response.status(400).json({
            message: "Resource ID required",
            error: true,
            success: false
        });
    }

    if (!isOwnerOrAdmin(request, resourceId)) {
        return response.status(403).json({
            message: "Access denied. You can only access your own resources",
            error: true,
            success: false
        });
    }

    next();
};