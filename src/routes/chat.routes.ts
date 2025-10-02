import { Router } from 'express';
import { handleChatMessage } from '../controllers/chat.controller';
import { validateChatInput } from '../middleware/validation.middleware';
import { chatLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/message', chatLimiter, validateChatInput, handleChatMessage);

export default router;