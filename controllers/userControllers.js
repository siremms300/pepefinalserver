import User from '../models/userModel.js';
import bcryptjs from 'bcryptjs';
import { 
    generateToken, 
    generateRefreshToken,  
    setAuthCookies, 
    clearAuthCookies 
} from '../utils/authUtils.js';
import { sendEmail, verifyEmailTemplate, passwordResetTemplate, welcomeEmailTemplate, testEmail} from '../config/sendEmail.js'; 
import cloudinary from '../config/cloudinary.js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

 

// Register User Controller
// export async function registerUserController(request, response) {
//     try {
//         const { name, email, password } = request.body;

//         // Validation
//         if (!name || !email || !password) {
//             return response.status(400).json({
//                 message: "Please provide name, email, and password",
//                 error: true,
//                 success: false
//             });
//         }

//         if (password.length < 6) {
//             return response.status(400).json({
//                 message: "Password must be at least 6 characters long",
//                 error: true,
//                 success: false
//             });
//         }

//         // Check if user already exists
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return response.status(409).json({
//                 message: "User already exists with this email",
//                 error: true,
//                 success: false
//             });
//         }

//         // Hash password
//         const salt = await bcryptjs.genSalt(10);
//         const hashPassword = await bcryptjs.hash(password, salt);

//         // Generate verification code
//         const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

//         // Create user with default 'user' role
//         const user = new User({
//             name,
//             email,
//             password: hashPassword,
//             role: 'user', // Default role
//             verify_Email: false,
//             forgot_password_otp: verificationCode,
//             forgot_password_expiry: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
//         });

//         const savedUser = await user.save();

//         // Generate verification URL
//         const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${verificationCode}&email=${email}`;

//         // Send verification email
//         try {
//             await sendEmail({
//                 sendTo: email,
//                 subject: "Verify Your Email - Pepe's Brunch and Cafe",
//                 html: verifyEmailTemplate({
//                     name,
//                     url: verifyEmailUrl
//                 })
//             });
//         } catch (emailError) {
//             console.error("Email sending failed:", emailError);
//         }

//         // Generate tokens
//         const token = generateToken(savedUser._id);
//         const refreshToken = generateRefreshToken(savedUser._id);

//         // Set cookies
//         setAuthCookies(response, token, refreshToken);

//         // Return response without sensitive data
//         const userResponse = {
//             _id: savedUser._id,
//             name: savedUser.name,
//             email: savedUser.email,
//             avatar: savedUser.avatar,
//             role: savedUser.role,
//             verify_Email: savedUser.verify_Email
//         };

//         return response.status(201).json({
//             message: "User registered successfully. Please verify your email.",
//             error: false,
//             success: true,
//             data: userResponse,
//             token,
//             refreshToken
//         });

//     } catch (error) {
//         console.error("Registration error:", error);
//         return response.status(500).json({
//             message: error.message || "Internal server error",
//             error: true,
//             success: false
//         });
//     }
// }


// Register User Controller (simplified - no email verification)
export async function registerUserController(request, response) {
    try {
        const { name, email, password, role = 'user' } = request.body;

        // Validation
        if (!name || !email || !password) {
            return response.status(400).json({
                message: "Please provide name, email, and password",
                error: true,
                success: false
            });
        }

        if (password.length < 6) {
            return response.status(400).json({
                message: "Password must be at least 6 characters long",
                error: true,
                success: false
            });
        }

        // Validate role
        if (!['user', 'admin', 'rider'].includes(role)) {
            return response.status(400).json({
                message: "Invalid role. Must be user, admin, or rider",
                error: true,
                success: false
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return response.status(409).json({
                message: "User already exists with this email",
                error: true,
                success: false
            });
        }

        // Hash password
        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(password, salt);

        // Create user (no email verification needed)
        const user = new User({
            name,
            email,
            password: hashPassword,
            role,
            verify_Email: true, // Auto-verify for immediate login
            status: role === 'rider' ? 'Inactive' : 'Active' // Riders need approval
        });

        const savedUser = await user.save();

        // Generate tokens
        const token = generateToken(savedUser._id, savedUser.role);
        const refreshToken = generateRefreshToken(savedUser._id, savedUser.role);

        // Set cookies
        setAuthCookies(response, token, refreshToken);

        // Return response without sensitive data
        const userResponse = {
            _id: savedUser._id,
            name: savedUser.name,
            email: savedUser.email,
            avatar: savedUser.avatar,
            role: savedUser.role,
            status: savedUser.status
        };

        return response.status(201).json({
            message: role === 'rider' 
                ? "Rider account created successfully. Awaiting admin approval."
                : "User registered successfully.",
            error: false,
            success: true,
            data: userResponse,
            token,
            refreshToken
        });

    } catch (error) {
        console.error("Registration error:", error);
        return response.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false
        });
    }
}







// Verify Email Controller
export async function verifyEmailController(request, response) {
    try {
        const { code, email } = request.body;

        if (!code || !email) {
            return response.status(400).json({
                message: "Verification code and email are required",
                error: true,
                success: false
            });
        }

        const user = await User.findOne({ 
            email, 
            forgot_password_otp: code,
            forgot_password_expiry: { $gt: Date.now() }
        });

        if (!user) {
            return response.status(400).json({
                message: "Invalid or expired verification code",
                error: true,
                success: false
            });
        }

        // Update user verification status
        user.verify_Email = true;
        user.forgot_password_otp = null;
        user.forgot_password_expiry = null;

        await user.save(); 


        // ///////////////////// this is where we send welcome email to the user after they verify email 
        try {
            await sendEmail({
                sendTo: email,
                subject: "Welcome to Pepe's Brunch and Cafe",
                html: welcomeEmailTemplate({
                    name: user.name
                })
            });
        } catch (emailError) {
            console.error("Email sending failed:", emailError);
        }

        return response.json({
            message: "Email verified successfully",
            error: false,
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                verify_Email: user.verify_Email
            }
        });

    } catch (error) {
        console.error("Email verification error:", error);
        return response.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false
        });
    }
}

// Login Controller
// export async function loginUserController(request, response) {
//     try {
//         const { email, password } = request.body;

//         if (!email || !password) {
//             return response.status(400).json({
//                 message: "Please provide email and password",
//                 error: true,
//                 success: false
//             });
//         }

//         // Find user and include password for comparison
//         const user = await User.findOne({ email }).select('+password');
//         if (!user) {
//             return response.status(401).json({
//                 message: "Invalid email or password",
//                 error: true,
//                 success: false
//             });
//         }

//         // Check if email is verified
//         if (!user.verify_Email) {
//             return response.status(401).json({
//                 message: "Please verify your email before logging in",
//                 error: true,
//                 success: false
//             });
//         }

//         // Check if account is active
//         if (user.status !== 'Active') {
//             return response.status(401).json({
//                 message: "Your account has been suspended. Please contact support.",
//                 error: true,
//                 success: false
//             });
//         }

//         // Check password
//         const isPasswordValid = await bcryptjs.compare(password, user.password);
//         if (!isPasswordValid) {
//             return response.status(401).json({
//                 message: "Invalid email or password",
//                 error: true,
//                 success: false
//             });
//         }

//         // Update last login
//         user.last_login_date = new Date();
//         await user.save();

//         // Generate tokens
//         // const token = generateToken(user._id);
//         // const refreshToken = generateRefreshToken(user._id);

//         const token = generateToken(user._id, user.role);
//         const refreshToken = generateRefreshToken(user._id, user.role);

//         // Set cookies
//         setAuthCookies(response, token, refreshToken);

//         // Return user data without password
//         const userResponse = {
//             _id: user._id,
//             name: user.name,
//             email: user.email,
//             avatar: user.avatar,
//             mobile: user.mobile,
//             role: user.role,
//             verify_Email: user.verify_Email,
//             last_login_date: user.last_login_date
//         };

//         return response.json({
//             message: "Login successful",
//             error: false,
//             success: true,
//             data: userResponse,
//             token,
//             refreshToken
//         });

//     } catch (error) {
//         console.error("Login error:", error);
//         return response.status(500).json({
//             message: error.message || "Internal server error",
//             error: true,
//             success: false
//         });
//     }
// }

// Login Controller (removed email verification check)
export async function loginUserController(request, response) {
    try {
        const { email, password } = request.body;

        if (!email || !password) {
            return response.status(400).json({
                message: "Please provide email and password",
                error: true,
                success: false
            });
        }

        // Find user and include password for comparison
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return response.status(401).json({
                message: "Invalid email or password",
                error: true,
                success: false
            });
        }

        // Check password
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return response.status(401).json({
                message: "Invalid email or password",
                error: true,
                success: false
            });
        }

        // Check if account is active
        if (user.status !== 'Active') {
            return response.status(401).json({
                message: user.status === 'Inactive' 
                    ? "Your account is pending approval. Please contact support."
                    : "Your account has been suspended. Please contact support.",
                error: true,
                success: false
            });
        }

        // Update last login
        user.last_login_date = new Date();
        await user.save();

        // Generate tokens
        const token = generateToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id, user.role);

        // Set cookies
        setAuthCookies(response, token, refreshToken);

        // Return user data without password
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            mobile: user.mobile,
            role: user.role,
            status: user.status,
            last_login_date: user.last_login_date
        };

        return response.json({
            message: "Login successful",
            error: false,
            success: true,
            data: userResponse,
            token,
            refreshToken
        });

    } catch (error) {
        console.error("Login error:", error);
        return response.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false
        });
    }
}



// Get Current User Controller
export async function getCurrentUserController(request, response) {
  try {
    // User is already attached to request by the auth middleware
    console.log('=== GET CURRENT USER ===');
    console.log('Request user:', request.user);
    const user = request.user;

    return response.json({
      message: "User retrieved successfully",
      error: false,
      success: true,
      data: user
    });

  } catch (error) {
    console.error("Get user error:", error);
    return response.status(500).json({
      message: error.message || "Internal server error",
      error: true,
      success: false
    });
  }
}



// Logout Controller
export async function logoutUserController(request, response) {
    try {
        // Clear cookies
        clearAuthCookies(response);

        return response.json({
            message: "Logout successful",
            error: false,
            success: true
        });

    } catch (error) {
        console.error("Logout error:", error);
        return response.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false
        });
    }
}

// Forgot Password Controller
export async function forgotPasswordController(request, response) {
    try {
        const { email } = request.body;

        if (!email) {
            return response.status(400).json({
                message: "Email is required",
                error: true,
                success: false
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return response.json({
                message: "If the email exists, a password reset link has been sent",
                error: false,
                success: true
            });
        }

        // Generate OTP
        const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save OTP with expiry (1 hour)
        user.forgot_password_otp = resetOtp;
        user.forgot_password_expiry = Date.now() + 60 * 60 * 1000;
        await user.save();

        // Generate reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?code=${resetOtp}&email=${email}`;

        // Send reset email
        try {
            await sendEmail({
                sendTo: email,
                subject: "Password Reset Request - Pepe's Brunch and Cafe",
                html: passwordResetTemplate({
                    name: user.name,
                    url: resetUrl
                })
            });
        } catch (emailError) {
            console.error("Password reset email failed:", emailError);
            return response.status(500).json({
                message: "Failed to send reset email",
                error: true,
                success: false
            });
        }

        return response.json({
            message: "If the email exists, a password reset link has been sent",
            error: false,
            success: true
        });

    } catch (error) {
        console.error("Forgot password error:", error);
        return response.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false
        });
    }
}

// Reset Password Controller
export async function resetPasswordController(request, response) {
    try {
        const { email, code, newPassword } = request.body;

        if (!email || !code || !newPassword) {
            return response.status(400).json({
                message: "Email, verification code, and new password are required",
                error: true,
                success: false
            });
        }

        if (newPassword.length < 6) {
            return response.status(400).json({
                message: "Password must be at least 6 characters long",
                error: true,
                success: false
            });
        }

        const user = await User.findOne({ 
            email, 
            forgot_password_otp: code,
            forgot_password_expiry: { $gt: Date.now() }
        });
  
        if (!user) { 
            return response.status(400).json({
                message: "Invalid or expired reset code", 
                error: true,
                success: false
            });
        }

        // Hash new password
        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(newPassword, salt);

        // Update password and clear OTP fields
        user.password = hashPassword;
        user.forgot_password_otp = null;
        user.forgot_password_expiry = null;
        await user.save();

        return response.json({
            message: "Password reset successfully",
            error: false,
            success: true
        });

    } catch (error) {
        console.error("Reset password error:", error);
        return response.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false
        });
    }
}

// Refresh Token Controller
export async function refreshTokenController(request, response) {
    try {
        const { refreshToken } = request.cookies;

        if (!refreshToken) {
            return response.status(401).json({
                message: "Refresh token required",
                error: true,
                success: false
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return response.status(401).json({
                message: "Invalid refresh token",
                error: true,
                success: false
            });
        }

        // Generate new tokens
        const newToken = generateToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        // Set new cookies
        setAuthCookies(response, newToken, newRefreshToken);

        return response.json({
            message: "Token refreshed successfully",
            error: false,
            success: true,
            token: newToken,
            refreshToken: newRefreshToken
        });

    } catch (error) {
        console.error("Refresh token error:", error);
        return response.status(401).json({
            message: "Invalid refresh token",
            error: true,
            success: false
        });
    }
} 










// //////////////////////////////// UPDATE USER DETAILS 
// controllers/userControllers.js - Add these functions

// Update User Profile Controller
export async function updateUserProfileController(request, response) {
    try {
        const userId = request.user._id;
        const { name, mobile } = request.body;

        // Validation
        if (!name) {
            return response.status(400).json({
                message: "Name is required",
                error: true,
                success: false
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return response.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        // Update fields
        user.name = name;
        if (mobile !== undefined) user.mobile = mobile;

        await user.save();

        // Return updated user data
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            mobile: user.mobile,
            role: user.role,
            verify_Email: user.verify_Email,
            last_login_date: user.last_login_date
        };

        return response.json({
            message: "Profile updated successfully",
            error: false,
            success: true,
            data: userResponse
        });

    } catch (error) {
        console.error("Update profile error:", error);
        return response.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false
        });
    }
}

// Update User Password Controller
export async function updateUserPasswordController(request, response) {
    try {
        const userId = request.user._id;
        const { currentPassword, newPassword } = request.body;

        // Validation
        if (!currentPassword || !newPassword) {
            return response.status(400).json({
                message: "Current password and new password are required",
                error: true,
                success: false
            });
        }

        if (newPassword.length < 6) {
            return response.status(400).json({
                message: "New password must be at least 6 characters long",
                error: true,
                success: false
            });
        }

        const user = await User.findById(userId).select('+password');
        if (!user) {
            return response.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return response.status(400).json({
                message: "Current password is incorrect",
                error: true,
                success: false
            });
        }

        // Hash new password
        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(newPassword, salt);

        // Update password
        user.password = hashPassword;
        await user.save();

        return response.json({
            message: "Password updated successfully",
            error: false,
            success: true
        });

    } catch (error) {
        console.error("Update password error:", error);
        return response.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false
        });
    }
}

// Upload User Avatar Controller
export async function uploadUserAvatarController(request, response) {
    try {
        const userId = request.user._id;

        if (!request.file) {
            return response.status(400).json({
                message: "Avatar image is required",
                error: true,
                success: false
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return response.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(request.file.path, {
            folder: 'jubian-market/avatars',
            width: 200,
            height: 200,
            crop: 'fill',
            quality: 'auto',
            fetch_format: 'auto'
        });

        // Delete old avatar from Cloudinary if exists
        if (user.avatar_public_id) {
            try {
                await cloudinary.uploader.destroy(user.avatar_public_id);
            } catch (deleteError) {
                console.error("Error deleting old avatar:", deleteError);
            }
        }

        // Update user avatar
        user.avatar = result.secure_url;
        user.avatar_public_id = result.public_id;
        await user.save();

        // Delete temporary file
        fs.unlinkSync(request.file.path);

        // Return updated user data
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            mobile: user.mobile,
            role: user.role,
            verify_Email: user.verify_Email,
            last_login_date: user.last_login_date
        };

        return response.json({
            message: "Avatar updated successfully",
            error: false,
            success: true,
            data: userResponse
        });

    } catch (error) {
        console.error("Upload avatar error:", error);
        
        // Delete temporary file if it exists
        if (request.file && fs.existsSync(request.file.path)) {
            fs.unlinkSync(request.file.path);
        }

        return response.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false
        });
    }
}

// Delete User Avatar Controller
export async function deleteUserAvatarController(request, response) {
    try {
        const userId = request.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return response.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        // Delete from Cloudinary if exists
        if (user.avatar_public_id) {
            try {
                await cloudinary.uploader.destroy(user.avatar_public_id);
            } catch (deleteError) {
                console.error("Error deleting avatar from Cloudinary:", deleteError);
            }
        }

        // Clear avatar fields
        user.avatar = "";
        user.avatar_public_id = "";
        await user.save();

        // Return updated user data
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            mobile: user.mobile,
            role: user.role,
            verify_Email: user.verify_Email,
            last_login_date: user.last_login_date
        };

        return response.json({
            message: "Avatar removed successfully",
            error: false,
            success: true,
            data: userResponse
        });

    } catch (error) {
        console.error("Delete avatar error:", error);
        return response.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false
        });
    }
}















// ///////////////////////////////// CONTROLLER FOR USERS 

// Add these admin functions to your existing userControllers.js

// Get All Users (Admin Only)
export async function getAllUsersController(request, response) {
    try {
        const { page = 1, limit = 10, search = '', status = '', role = '' } = request.query;
        
        // Build filter object
        const filter = {};
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status && status !== 'All') {
            filter.status = status;
        }
        
        if (role && role !== 'All') {
            filter.role = role.toLowerCase();
        }

        // Get users with pagination
        const users = await User.find(filter)
            .select('-password -refresh_token -forgot_password_otp -forgot_password_expiry')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Get total count for pagination
        const total = await User.countDocuments(filter);

        return response.json({
            message: "Users retrieved successfully",
            error: false,
            success: true,
            data: users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalUsers: total,
                usersPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error("Get all users error:", error);
        return response.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false
        });
    }
}

// Get User by ID (Admin Only)
export async function getUserByIdController(request, response) {
    try {
        const { id } = request.params;

        const user = await User.findById(id)
            .select('-password -refresh_token -forgot_password_otp -forgot_password_expiry')
            .populate('orderHistory', 'orderNumber totalAmount status createdAt')
            .populate('address_details', 'name phone address city state postalCode isDefault');

        if (!user) {
            return response.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        return response.json({
            message: "User retrieved successfully",
            error: false,
            success: true,
            data: user
        });

    } catch (error) {
        console.error("Get user by ID error:", error);
        return response.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false
        });
    }
}

// Update User Status (Admin Only)
export async function updateUserStatusController(request, response) {
    try {
        const { id } = request.params;
        const { status } = request.body;

        if (!['Active', 'Inactive', 'Suspended'].includes(status)) {
            return response.status(400).json({
                message: "Invalid status. Must be Active, Inactive, or Suspended",
                error: true,
                success: false
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).select('-password -refresh_token -forgot_password_otp -forgot_password_expiry');

        if (!user) {
            return response.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        return response.json({
            message: `User status updated to ${status}`,
            error: false,
            success: true,
            data: user
        });

    } catch (error) {
        console.error("Update user status error:", error);
        return response.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false
        });
    }
}

// Update User Role (Admin Only)
export async function updateUserRoleController(request, response) {
    try {
        const { id } = request.params;
        const { role } = request.body;

        if (!['user', 'admin'].includes(role)) {
            return response.status(400).json({
                message: "Invalid role. Must be user or admin",
                error: true,
                success: false
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        ).select('-password -refresh_token -forgot_password_otp -forgot_password_expiry');

        if (!user) {
            return response.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        return response.json({
            message: `User role updated to ${role}`,
            error: false,
            success: true,
            data: user
        });

    } catch (error) {
        console.error("Update user role error:", error);
        return response.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false
        });
    }
}

// Delete User (Admin Only)
export async function deleteUserController(request, response) {
    try {
        const { id } = request.params;

        const user = await User.findById(id);
        if (!user) {
            return response.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === request.user._id.toString()) {
            return response.status(400).json({
                message: "Cannot delete your own account",
                error: true,
                success: false
            });
        }

        // Delete avatar from Cloudinary if exists
        if (user.avatar_public_id) {
            try {
                await cloudinary.uploader.destroy(user.avatar_public_id);
            } catch (deleteError) {
                console.error("Error deleting avatar from Cloudinary:", deleteError);
            }
        }

        // Delete user
        await User.findByIdAndDelete(id);

        return response.json({
            message: "User deleted successfully",
            error: false,
            success: true
        });

    } catch (error) {
        console.error("Delete user error:", error);
        return response.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false
        });
    }
}

// Get User Statistics (Admin Only)
export async function getUserStatsController(request, response) {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ status: 'Active' });
        const inactiveUsers = await User.countDocuments({ status: 'Inactive' });
        const suspendedUsers = await User.countDocuments({ status: 'Suspended' });
        const adminUsers = await User.countDocuments({ role: 'admin' });
        const customerUsers = await User.countDocuments({ role: 'user' });
        
        // Get users registered in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newUsers = await User.countDocuments({ 
            createdAt: { $gte: thirtyDaysAgo } 
        });

        return response.json({
            message: "User statistics retrieved successfully",
            error: false,
            success: true,
            data: {
                totalUsers,
                activeUsers,
                inactiveUsers,
                suspendedUsers,
                adminUsers,
                customerUsers,
                newUsers
            }
        });

    } catch (error) {
        console.error("Get user stats error:", error);
        return response.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false
        });
    }
}




