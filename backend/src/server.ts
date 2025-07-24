import app from './app';
import { config } from './config/env';
import { connectDB } from './config/database';
import logger from './config/logger';
import scraperJob from './jobs/scraperJob';

const PORT = config.port;

async function startServer() {
  try {
    // Connect to database
    await connectDB();

    // Start the server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`);
      logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
      logger.info(`📚 API documentation at http://localhost:${PORT}/api`);
    });

    // Start the scraper job
    scraperJob.start();

    // Graceful shutdown
    const shutdown = (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close server after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();