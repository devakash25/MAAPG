import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/environment';
import { apiLimiter } from './middleware/rateLimit.middleware';
import errorHandler from './middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import dealerRoutes from './modules/dealers/dealer.routes';
import propertyRoutes from './modules/properties/property.routes';
import roomRoutes from './modules/rooms/room.routes';
import bookingRoutes from './modules/bookings/booking.routes';
import paymentRoutes from './modules/payments/payment.routes';
import reviewRoutes from './modules/reviews/review.routes';
import enquiryRoutes from './modules/enquiries/enquiry.routes';
import complaintRoutes from './modules/complaints/complaint.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import settingsRoutes from './modules/settings/settings.routes';
import auditRoutes from './modules/audit/audit.routes';
import offerRoutes from './modules/offers/offer.routes';
import ownerRoutes from './modules/owner/owner.routes';
import buyerRoutes from './modules/buyer/buyer.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/buyer', buyerRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handler
app.use(errorHandler);

export default app;
