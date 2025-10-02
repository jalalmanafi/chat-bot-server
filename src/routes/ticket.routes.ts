import { Router } from 'express';
import multer from 'multer';
import {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  uploadReceipt
} from '../controllers/ticket.controller';
import { validateTicketInput } from '../middleware/validation.middleware';
import { createTicketLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Ticket routes
router.post('/', createTicketLimiter, validateTicketInput, createTicket);
router.get('/', getAllTickets);
router.get('/:id', getTicketById);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);
router.post('/:id/receipt', upload.single('file'), uploadReceipt);

export default router;