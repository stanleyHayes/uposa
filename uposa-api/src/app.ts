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

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: [env.CLIENT_URL, env.ADMIN_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Static files (uploads)
app.use('/uploads', express.static(path.resolve(env.UPLOAD_PATH)));

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
app.use('/api/admin', adminRoutes);

// 404 handler
app.use(notFoundMiddleware);

// Global error handler
app.use(errorMiddleware);

export default app;
