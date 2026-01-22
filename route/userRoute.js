import { Router } from 'express';
import { 
    registerUserController, 
    loginUserController, 
    logoutUserController,
    getCurrentUserController,
    forgotPasswordController,
    resetPasswordController, 
    updateUserProfileController,
    updateUserPasswordController,
    uploadUserAvatarController,
    deleteUserAvatarController,
    // ADMIN 
    getAllUsersController,
    getUserByIdController,
    updateUserStatusController,
    updateUserRoleController,
    deleteUserController,
    getUserStatsController
} from '../controllers/userControllers.js';
import { authenticateToken, requireAdmin } from '../utils/authUtils.js'; 
import multer from 'multer';

const userRouter = Router();


// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

userRouter.post('/register', registerUserController);
userRouter.post('/login', loginUserController);
userRouter.post('/logout', logoutUserController);
userRouter.get('/me', authenticateToken, getCurrentUserController); 
userRouter.post('/forgot-password', forgotPasswordController); 
userRouter.post('/reset-password', resetPasswordController);  



userRouter.put('/profile', authenticateToken, updateUserProfileController);
userRouter.put('/password', authenticateToken, updateUserPasswordController);
// userRouter.post('/avatar', authenticateToken, upload.single('avatar'), uploadUserAvatarController);
userRouter.delete('/avatar', authenticateToken, deleteUserAvatarController);

userRouter.post('/avatar', authenticateToken, upload.fields([
    { name: 'avatar', maxCount: 1 }
]), uploadUserAvatarController);




// ADMIN 
// Admin only routes
userRouter.get('/admin/users', authenticateToken, requireAdmin, getAllUsersController);
userRouter.get('/admin/users/stats', authenticateToken, requireAdmin, getUserStatsController);
userRouter.get('/admin/users/:id', authenticateToken, requireAdmin, getUserByIdController);
userRouter.put('/admin/users/:id/status', authenticateToken, requireAdmin, updateUserStatusController);
userRouter.put('/admin/users/:id/role', authenticateToken, requireAdmin, updateUserRoleController);
userRouter.delete('/admin/users/:id', authenticateToken, requireAdmin, deleteUserController);



export default userRouter; 



