import { Router } from 'express';
import { verifyEmailController} from '../controllers/userControllers.js';

const authRouter = Router();

authRouter.post('/verify-email', verifyEmailController);

export default authRouter; 


