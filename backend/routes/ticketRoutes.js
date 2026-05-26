import express from 'express';
import {
  createTicket,
  getTickets,
  updateTicket,
  deleteTicket,
  getTicketStats
} from '../controllers/ticketController.js';

const router = express.Router();

// Specific routes first to prevent conflicts with :id
router.get('/stats', getTicketStats);

// General resource routes
router.post('/', createTicket);
router.get('/', getTickets);
router.patch('/:id', updateTicket);
router.delete('/:id', deleteTicket);

export default router;
