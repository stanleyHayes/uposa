import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import { env } from './config/env';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import membersRoutes from './modules/members/members.routes';
import { adminMembersRouter } from './modules/members/members.routes';
import eventsRoutes from './modules/events/events.routes';
import projectsRoutes from './modules/projects/projects.routes';
import newsRoutes from './modules/news/news.routes';
import donationsRoutes from './modules/donations/donations.routes';
import duesRoutes from './modules/dues/dues.routes';
import jobsRoutes from './modules/jobs/jobs.routes';
import mentorshipRoutes from './modules/mentorship/mentorship.routes';
import forumRoutes from './modules/forum/forum.routes';
import pollsRoutes from './modules/polls/polls.routes';
import electionsRoutes from './modules/elections/elections.routes';
import contactRoutes from './modules/contact/contact.routes';
import adminRoutes from './modules/admin/admin.routes';
import executivesRoutes from './modules/executives/executives.routes';
import { adminExecutivesRouter } from './modules/executives/executives.routes';
import siteDataRoutes, { adminSiteDataRouter } from './modules/site-data/site-data.routes';
import paymentMethodsRoutes from './modules/payment-methods/payment-methods.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import transcriptsRoutes from './modules/transcripts/transcripts.routes';
import newsletterRoutes, { adminNewsletterRouter } from './modules/newsletter/newsletter.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import galleryRoutes, { adminGalleryRouter } from './modules/gallery/gallery.routes';
import schoolLeadersRoutes, { adminSchoolLeadersRouter } from './modules/school-leaders/school-leaders.routes';

const app = express();

// Behind a reverse proxy (Render). Trust the first proxy hop so
// X-Forwarded-For is honored by middleware that needs accurate client IPs
// (e.g. express-rate-limit).
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [env.CLIENT_URL, env.ADMIN_URL, ...env.ALLOWED_ORIGINS];
    // Allow all localhost origins in development
    if (!origin || allowedOrigins.includes(origin) || (env.NODE_ENV !== 'production' && origin?.match(/^https?:\/\/localhost(:\d+)?$/))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Stripe webhook needs raw body for signature verification
app.use('/api/payments/webhooks/stripe', express.raw({ type: 'application/json' }));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'UPOSA API is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/admin/members', adminMembersRouter);
app.use('/api/events', eventsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/dues', duesRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/polls', pollsRoutes);
app.use('/api/elections', electionsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/executives', executivesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/executives', adminExecutivesRouter);
app.use('/api/public', siteDataRoutes);
app.use('/api/admin/site', adminSiteDataRouter);
app.use('/api/payment-methods', paymentMethodsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/transcripts', transcriptsRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/admin/notifications', notificationsRoutes);
app.use('/api/admin/newsletter', adminNewsletterRouter);
app.use('/api/gallery', galleryRoutes);
app.use('/api/admin/gallery', adminGalleryRouter);
app.use('/api/school-leaders', schoolLeadersRoutes);
app.use('/api/admin/school-leaders', adminSchoolLeadersRouter);

// 404 handler
app.use(notFoundMiddleware);

// Global error handler
app.use(errorMiddleware);

export default app;
