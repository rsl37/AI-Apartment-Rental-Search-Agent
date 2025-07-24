import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    url: process.env.DATABASE_URL || 'sqlite:./dev.db',
    type: process.env.DB_TYPE || 'sqlite', // 'sqlite' or 'postgresql'
  },
  
  // External APIs
  scraperApi: {
    key: process.env.SCRAPER_API_KEY || '',
    baseUrl: process.env.SCRAPER_API_URL || 'http://api.scraperapi.com',
  },
  
  brightData: {
    username: process.env.BRIGHT_DATA_USERNAME || '',
    password: process.env.BRIGHT_DATA_PASSWORD || '',
    endpoint: process.env.BRIGHT_DATA_ENDPOINT || '',
  },
  
  // Twilio SMS
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },
  
  // NYC APIs
  nycDoh: {
    apiKey: process.env.NYC_DOH_API_KEY || '',
    baseUrl: process.env.NYC_DOH_BASE_URL || 'https://data.cityofnewyork.us/resource',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m', // Shorter for security
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // Security
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-encryption-key-change-in-production',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    sessionSecret: process.env.SESSION_SECRET || 'session-secret-change-in-production',
    mfaIssuer: process.env.MFA_ISSUER || 'AI Apartment Rental Agent',
  },
  
  // Cron Jobs
  scraper: {
    schedule: process.env.SCRAPER_SCHEDULE || '0 6 * * *', // 6:00 AM UTC daily
    timezone: process.env.SCRAPER_TIMEZONE || 'UTC',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  
  // File Upload
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },
};

export default config;