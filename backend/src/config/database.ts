import { PrismaClient } from '@prisma/client';
import { config } from './env';

declare global {
  var __db__: PrismaClient | undefined;
}

let db: PrismaClient;

if (config.nodeEnv === 'production') {
  db = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  db = global.__db__;
}

export { db };

// Database connection helper
export const connectDB = async (): Promise<void> => {
  try {
    await db.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Database disconnection helper
export const disconnectDB = async (): Promise<void> => {
  try {
    await db.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
  }
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

export default db;