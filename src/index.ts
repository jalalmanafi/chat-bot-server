import express from 'express';
import dotenv from 'dotenv';
import { corsMiddleware } from './middleware/cors.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { testConnection } from './config/database';
import { logger } from './utils/logger';
import chatRoutes from './routes/chat.routes';
import ticketRoutes from './routes/ticket.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (for rate limiting behind Vercel)
app.set('trust proxy', 1);

// Middleware
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all routes
app.use('/api', apiLimiter);

// Health check routes (no rate limit)
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CityCard Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      chat: '/api/chat/message',
      tickets: '/api/tickets'
    }
  });
});

app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  const status = dbConnected ? 'healthy' : 'unhealthy';

  res.status(dbConnected ? 200 : 503).json({
    status,
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/tickets', ticketRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server (for local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, async () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📍 http://localhost:${PORT}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

    // Test database connection
    await testConnection();
  });
}

// Export for Vercel
export default app;