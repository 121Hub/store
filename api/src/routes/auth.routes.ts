import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';

const router = Router();

router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/confirm-email', AuthController.confirmEmail);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// OAuth flow endpoints
router.get('/oauth/:provider', AuthController.oauthRedirect);
router.get('/oauth/:provider/callback', AuthController.oauthCallback);

export default router;
