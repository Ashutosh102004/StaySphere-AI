import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes';
import propertyRoutes from './modules/properties/property.routes';
import bookingRoutes from './modules/bookings/booking.routes';
import availabilityRoutes from './modules/availability/availability.routes';
import paymentRoutes from './modules/payments/payment.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import identityRoutes from './modules/identity/identity.routes';
import wishlistRoutes from './modules/wishlist/wishlist.routes';
import ticketRoutes from './modules/support/ticket.routes';
import reviewRoutes from './modules/reviews/review.routes';
import adminRoutes from './modules/admin/admin.routes';
import aiRoutes from './modules/ai/ai.routes';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Readiness check endpoint
app.get('/ready', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'READY', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'StaySphere AI API',
    version: '0.1.0',
    status: 'Running',
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/availability', availabilityRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/identity', identityRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/support/tickets', ticketRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/ai', aiRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
