import express from 'express';
import {
  createTicket,
  getTickets,
  updateTicket,
  deleteTicket,
  getTicketStats
} from '../controllers/ticketController.js';

const router = express.Router();

router.get('/stats', getTicketStats);
router.post('/', createTicket);
router.get('/', getTickets);
router.patch('/:id', updateTicket);
router.delete('/:id', deleteTicket);

export default router;
