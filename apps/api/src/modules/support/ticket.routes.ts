import { Router } from 'express';
import * as ticketController from './ticket.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/rbac.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User routes
router.post('/', ticketController.createTicket);

router.get('/my-tickets', ticketController.getUserTickets);

router.get('/:ticketId', ticketController.getTicketById);

router.post(
  '/:ticketId/messages',
  ticketController.addTicketMessage
);

router.patch(
  '/:ticketId/close',
  ticketController.closeTicket
);

// Support staff routes
router.get(
  '/',
  authorize('SUPPORT', 'ADMIN'),
  ticketController.getAllTickets
);

router.patch(
  '/:ticketId/status',
  authorize('SUPPORT', 'ADMIN'),
  ticketController.updateTicketStatus
);

router.get(
  '/assigned/to-me',
  authorize('SUPPORT', 'ADMIN'),
  ticketController.getAssignedTickets
);

// Admin routes
router.patch(
  '/:ticketId/priority',
  authorize('ADMIN'),
  ticketController.updateTicketPriority
);

router.patch(
  '/:ticketId/assign',
  authorize('ADMIN'),
  ticketController.assignTicket
);

router.get(
  '/admin/stats',
  authorize('ADMIN'),
  ticketController.getTicketStats
);

export default router;
