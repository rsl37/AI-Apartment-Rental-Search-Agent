# AI Apartment Rental Agent

A full-stack web application that automatically scrapes apartment listings from StreetEasy, Zillow, Apartments.com, Renthop, and Redfin, filters them based on specific criteria, and sends SMS notifications to verified users about new listings.

## Overview

A full-stack web application that automatically scrapes apartment listings from StreetEasy, Zillow, and Apartments.com, filters them based on specific criteria, and sends SMS notifications to verified users about new listings.

## 🛡️ Security Features

This application implements enterprise-level security measures to ensure robust protection of sensitive data:

### Authentication & Authorization
- **OAuth 2.0/OpenID Connect**: Secure third-party authentication support
- **Multi-Factor Authentication (MFA)**: TOTP-based MFA using authenticator apps
- **Role-Based Access Control (RBAC)**: Admin, Moderator, and User roles with granular permissions
- **Enhanced JWT**: Short-lived tokens (15 minutes) with refresh token rotation
- **Session Management**: Secure session handling with proper expiration

### Data Protection
- **AES-256 Encryption**: Sensitive data encrypted at rest using industry-standard encryption
- **Data Masking**: Automatic masking of sensitive data in logs and error messages
- **Secure Environment Management**: All secrets managed through environment variables
- **Input Sanitization**: Comprehensive input validation and sanitization using express-validator

### Network Security
- **HTTPS Enforcement**: HSTS headers for secure connections
- **Content Security Policy (CSP)**: Protection against XSS attacks
- **Security Headers**: Comprehensive security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- **CORS Restrictions**: Configurable CORS policies for trusted domains only

### API Security
- **Rate Limiting**: Multiple rate limiting strategies for different endpoints
- **Request Validation**: Strict validation of all API requests
- **Authentication Required**: JWT verification for protected endpoints
- **Permission-Based Access**: Granular permission checks for all operations

### Audit & Monitoring
- **Comprehensive Logging**: All security events logged with timestamps and IP addresses
- **Suspicious Activity Detection**: Automated detection and alerting for suspicious behavior
- **Security Monitoring**: Integration with monitoring tools (Sentry, Datadog, Slack)
- **Audit Trail**: Complete audit trail for all data modifications

### Automated Security
- **Dependency Scanning**: Automated vulnerability scanning with Dependabot and Snyk
- **Code Security Analysis**: GitHub CodeQL for static code analysis
- **Secret Scanning**: TruffleHog integration for secret detection
- **License Compliance**: Automated license compliance checking

## 🏗 Architecture

- **Backend**: Node.js + Express.js + TypeScript + Prisma ORM
- **Frontend**: React + TypeScript + Material-UI
- **Database**: SQLite (development) / PostgreSQL (production)
- **Scheduling**: node-cron for daily scraping jobs
- **Notifications**: Twilio SMS integration
- **Scraping**: ScraperAPI or BrightData integration

## 🎯 Features

### Backend Features
- **Automated Scraping**: Daily scheduled jobs that scrape apartment data from multiple sources
- **Smart Filtering**: Filters apartments by location, price, size, amenities, and health/safety criteria
- **SMS Notifications**: Two-step SMS verification and daily digest notifications via Twilio
- **REST API**: Comprehensive API for apartment listings, user management, reports, and notifications
- **Data Export**: CSV export functionality for apartment listings
- **Health Checks**: NYC DOH API integration to check for asbestos, lead paint, bedbugs, and mold

### Frontend Features
- **Responsive Dashboard**: Real-time stats, search health, and activity feed
- **Report Viewer**: View current and historical daily research reports with date navigation
- **Living Spreadsheet**: Sortable/filterable apartment listings with full details
- **Notification Settings**: Add/verify phone numbers, toggle alert preferences, view delivery history
- **Apartment Details**: Modal with all metadata, amenities, verification status, and contacts
- **Mobile-First Design**: Fully responsive across all devices

### Key Filtering Criteria
- **Location**: Manhattan below 80th Street
- **Price**: $2,000–$4,500/month
- **Size**: Studio/1BR, minimum 600 sqft
- **Amenities**: Cat-friendly, doorman/concierge, A/C, dishwasher, elevator, laundry
- **Availability**: August 1–October 1, 2025
- **Health/Safety**: No asbestos, lead paint, bedbugs, or mold

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rsl37/AI-Apartment-Rental-Search-Agent.git
   cd AI-Apartment-Rental-Search-Agent
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp ../.env.example .env
   # Edit .env with your configuration
   npx prisma generate
   npx prisma migrate dev --name init
   npm run dev
   ```

3. **Set up the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   echo "VITE_API_BASE_URL=http://localhost:3001/api" > .env
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api

## 📁 Project Structure

```
AI-Apartment-Rental-Search-Agent/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── config/                # Configuration files
│   │   │   ├── database.ts        # Database connection
│   │   │   ├── env.ts             # Environment variables
│   │   │   └── logger.ts          # Winston logger setup
│   │   ├── controllers/           # API controllers
│   │   │   ├── apartmentsController.ts
│   │   │   ├── notificationsController.ts
│   │   │   ├── reportsController.ts
│   │   │   └── usersController.ts
│   │   ├── jobs/                  # Scheduled jobs
│   │   │   └── scraperJob.ts      # Daily scraping job
│   │   ├── middlewares/           # Express middlewares
│   │   │   ├── authMiddleware.ts  # JWT authentication
│   │   │   └── errorHandler.ts    # Error handling
│   │   ├── models/                # TypeScript interfaces
│   │   │   ├── Apartment.ts
│   │   │   ├── Notification.ts
│   │   │   ├── Report.ts
│   │   │   └── User.ts
│   │   ├── routes/                # API routes
│   │   │   ├── apartmentsRoutes.ts
│   │   │   ├── notificationsRoutes.ts
│   │   │   ├── reportsRoutes.ts
│   │   │   └── usersRoutes.ts
│   │   ├── utils/                 # Utility functions
│   │   │   ├── scraperUtils.ts    # Web scraping logic
│   │   │   ├── smsUtils.ts        # Twilio SMS functions
│   │   │   └── validationUtils.ts # Joi validation schemas
│   │   ├── app.ts                 # Express app setup
│   │   └── server.ts              # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/                   # API request handlers
│   │   │   └── apartmentsApi.ts
│   │   ├── components/            # React components
│   │   │   ├── Dashboard/
│   │   │   ├── Modals/
│   │   │   ├── Notifications/
│   │   │   ├── Reports/
│   │   │   ├── Spreadsheet/
│   │   │   └── Shared/
│   │   │       └── Header.tsx
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── pages/                 # Top-level pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Notifications.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── Spreadsheet.tsx
│   │   ├── styles/                # Global styles
│   │   │   └── globals.css
│   │   ├── utils/                 # Helper functions
│   │   │   └── apiClient.ts       # Axios configuration
│   │   ├── App.tsx                # Main App component
│   │   └── main.tsx               # React entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── .env.example                   # Environment variables template
├── .gitignore
└── README.md
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure the following:

#### Required for Basic Functionality
- `DATABASE_URL`: Database connection string
- `JWT_SECRET`: Secret for JWT token signing (32+ characters recommended)
- `ENCRYPTION_KEY`: AES-256 encryption key (32 characters)

### Security Configuration
- `BCRYPT_ROUNDS`: Password hashing rounds (default: 12)
- `SESSION_SECRET`: Session secret for OAuth flows
- `MFA_ISSUER`: MFA issuer name for TOTP apps

### Multi-Factor Authentication (Optional)
- Enable MFA in user settings after registration
- Supports TOTP apps like Google Authenticator, Authy
- Backup codes provided for account recovery

### OAuth 2.0 Configuration (Optional)
- `OAUTH_CLIENT_ID`: OAuth provider client ID
- `OAUTH_CLIENT_SECRET`: OAuth provider client secret  
- `OAUTH_AUTHORIZATION_URL`: OAuth authorization endpoint
- `OAUTH_TOKEN_URL`: OAuth token endpoint
- `OAUTH_CALLBACK_URL`: OAuth callback URL

### Security Monitoring (Optional)
- `SENTRY_DSN`: Sentry DSN for error monitoring
- `DATADOG_API_KEY`: Datadog API key for metrics
- `SLACK_WEBHOOK_URL`: Slack webhook for security alerts
- `ALERT_EMAIL`: Email address for security notifications

### Required for Scraping
- `SCRAPER_API_KEY`: ScraperAPI key for web scraping
- OR `BRIGHT_DATA_*`: BrightData credentials

#### Required for SMS Notifications
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_PHONE_NUMBER`: Twilio phone number

#### Optional
- `NYC_DOH_API_KEY`: NYC Department of Health API key
- `SCRAPER_SCHEDULE`: Cron schedule for scraping (default: "0 6 * * *")

### Database Setup

The application uses Prisma ORM with SQLite for development and supports PostgreSQL for production.

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# View database in Prisma Studio
npx prisma studio
```

## 📚 API Documentation

### Base URL
`http://localhost:3001/api`

### Base URL
`http://localhost:3001/api`

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Security Endpoints

#### Authentication & MFA
- `POST /auth/mfa/setup` - Set up multi-factor authentication
- `POST /auth/mfa/verify-setup` - Verify MFA setup with token
- `POST /auth/mfa/verify` - Verify MFA token during login
- `POST /auth/mfa/backup-codes` - Generate new backup codes
- `POST /auth/token/refresh` - Refresh access token

#### OAuth 2.0
- `GET /auth/oauth/authorize` - Initiate OAuth flow
- `GET /auth/oauth/callback` - OAuth callback endpoint
- `GET /auth/.well-known/openid_configuration` - OpenID Connect configuration

#### Security Monitoring
- `GET /auth/security/status` - Get security status and metrics (Admin only)

### Endpoints

#### Apartments
- `GET /apartments` - Get apartments with filtering and pagination
- `GET /apartments/:id` - Get single apartment details
- `GET /apartments/export/csv` - Export apartments to CSV
- `POST /apartments` - Create new apartment (admin)
- `PUT /apartments/:id` - Update apartment (admin)
- `DELETE /apartments/:id` - Delete apartment (admin)

#### Users
- `POST /users/register` - Register phone number
- `POST /users/verify` - Verify phone number with code
- `POST /users/resend-verification` - Resend verification code
- `GET /users/:id` - Get user profile
- `PUT /users/:id/preferences` - Update alert preferences
- `POST /users/:userId/saved-apartments` - Save apartment
- `DELETE /users/:userId/saved-apartments/:apartmentId` - Remove saved apartment

#### Notifications
- `GET /notifications/users/:userId` - Get user notifications
- `GET /notifications/users/:userId/stats` - Get notification statistics
- `POST /notifications` - Send notification
- `PUT /notifications/:id/read` - Mark notification as read

#### Reports
- `GET /reports` - Get all reports with filtering
- `GET /reports/latest` - Get latest daily report
- `GET /reports/stats` - Get report statistics
- `GET /reports/:id` - Get single report
- `POST /reports/generate/daily` - Generate daily report

### Security Query Parameters

#### Rate Limiting
All endpoints are rate-limited. Default limits:
- General API: 1000 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- Standard endpoints: 100 requests per 15 minutes

#### Error Responses
Security-enhanced error responses that don't leak sensitive information:
```json
{
  "error": "Authentication required",
  "code": "AUTH_REQUIRED",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/protected-endpoint"
}
```

### Query Parameters

#### Apartment Filtering
```
GET /apartments?minPrice=2000&maxPrice=4500&bedrooms=0,1&isCatFriendly=true&isDoorman=true
```

Supported filters:
- `minPrice`, `maxPrice`: Price range in dollars
- `bedrooms`: Array of bedroom counts (0 for studio)
- `bathrooms`: Minimum bathrooms
- `minSqft`: Minimum square footage
- `neighborhoods`: Array of neighborhood names
- `isDoorman`, `hasConcierge`, `hasAC`, `hasDishwasher`, `hasElevator`: Boolean amenity filters
- `hasLaundryUnit`, `hasLaundryBuilding`, `isCatFriendly`: Boolean amenity filters
- `availableFrom`, `availableTo`: Date range for availability
- `excludeHealthIssues`: Exclude apartments with health/safety issues
- `search`: Text search across title, address, neighborhood, description

## 🤖 Automation

### Daily Scraping Job

The application runs a daily scraping job at 6:00 AM UTC that:

1. **Scrapes** apartment listings from StreetEasy, Zillow, and Apartments.com
2. **Filters** results based on the specified criteria
3. **Updates** the database with new and updated listings
4. **Generates** a daily report with statistics and insights
5. **Sends** SMS notifications to verified users about new listings

### Cron Schedule Configuration

```bash
# Default: Daily at 6:00 AM UTC
SCRAPER_SCHEDULE="0 6 * * *"

# Examples:
# Every 2 hours: "0 */2 * * *"
# Twice daily (6 AM and 6 PM): "0 6,18 * * *"
# Weekdays only at 8 AM: "0 8 * * 1-5"
```

## 📱 SMS Notifications

### Phone Number Verification

1. User submits phone number via API or frontend
2. System generates 6-digit verification code
3. Code sent via Twilio SMS
4. User enters code to verify phone number
5. Verified users receive daily digest notifications

### Notification Types

- **Daily Digest**: Summary of new and updated listings
- **Instant Alerts**: Real-time notifications for matching listings
- **Price Drop Alerts**: Notifications when saved apartments drop in price

### SMS Commands

Users can text the following commands to the Twilio number:
- `STOP` or `UNSUBSCRIBE`: Disable all notifications
- `START` or `SUBSCRIBE`: Re-enable notifications

## 🔒 Security Best Practices

### For Development
1. **Never commit secrets**: Use `.env` files and keep them out of version control
2. **Use strong passwords**: Generate secure passwords for all accounts
3. **Enable MFA**: Set up multi-factor authentication for all admin accounts
4. **Regular updates**: Keep dependencies updated using `npm audit` and Dependabot
5. **Code scanning**: Use the provided GitHub Actions for automated security scanning

### For Production
1. **Environment Security**:
   ```bash
   # Use strong, unique secrets
   JWT_SECRET="$(openssl rand -base64 32)"
   ENCRYPTION_KEY="$(openssl rand -base64 32)"
   SESSION_SECRET="$(openssl rand -base64 32)"
   ```

2. **Database Security**:
   ```bash
   # PostgreSQL with SSL
   DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"
   ```

3. **Network Security**:
   ```bash
   # Restrict CORS to your domain
   CORS_ORIGIN="https://yourdomain.com"
   ```

4. **Monitoring Setup**:
   ```bash
   # Configure monitoring services
   SENTRY_DSN="your-sentry-dsn"
   SLACK_WEBHOOK_URL="your-slack-webhook"
   ALERT_EMAIL="security@yourcompany.com"
   ```

### Security Checklist
- [ ] All environment variables configured with strong values
- [ ] Database secured with proper authentication and SSL
- [ ] HTTPS enforced in production
- [ ] Rate limiting configured appropriately
- [ ] Monitoring and alerting set up
- [ ] Regular security scans scheduled
- [ ] Backup and recovery procedures tested
- [ ] Staff trained on security best practices

## 🚢 Deployment

### Environment Setup

1. **Production Database**: Set up PostgreSQL and update `DATABASE_URL`
2. **Environment Variables**: Configure all required environment variables
3. **Build Applications**: Run build commands for both frontend and backend

### Deployment Platforms

#### Vercel (Recommended for Frontend)
```bash
cd frontend
npm run build
# Deploy to Vercel
```

#### Railway/Render (Recommended for Backend)
```bash
cd backend
npm run build
# Deploy to Railway or Render
```

#### Heroku
```bash
# Create Heroku apps
heroku create your-app-backend
heroku create your-app-frontend

# Deploy backend
cd backend
git push heroku main

# Deploy frontend
cd frontend
git push heroku main
```

### Environment Variables for Production

```bash
# Backend
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
CORS_ORIGIN="https://your-frontend-domain.com"
JWT_SECRET="your-production-jwt-secret"
ENCRYPTION_KEY="your-production-encryption-key"

# Frontend
VITE_API_BASE_URL="https://your-backend-domain.com/api"
```

### Database Migration

```bash
# Run migrations in production
npx prisma migrate deploy
```

## 🧪 Development

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check
```

### Development Workflow

1. **Start both servers**: Backend on :3001, Frontend on :3000
2. **Database changes**: Update Prisma schema and run migrations
3. **API changes**: Update controllers, routes, and frontend API clients
4. **Testing**: Add tests for new functionality
5. **Documentation**: Update API documentation and README

## 📊 Monitoring

### Health Checks

- Backend health: `GET /health`
- Database connectivity: Included in health check
- Scraper status: Check scraper job logs
- Security status: `GET /api/auth/security/status` (Admin only)

### Security Monitoring

Real-time security monitoring includes:
- **Authentication failures**: Failed login attempts tracked and alerted
- **Rate limit violations**: Excessive requests automatically blocked
- **Suspicious activities**: Unusual access patterns detected
- **Data access**: All sensitive data access logged and monitored

### Logging

The application uses Winston for structured logging:

- **Development**: Console output with colors
- **Production**: File-based logging (`logs/` directory)
- **Levels**: error, warn, info, http, debug

- **Global error handler**: Catches and logs all unhandled errors
- **API errors**: Consistent error response format with security considerations
- **Validation errors**: Detailed field-level validation messages
- **Security events**: All authentication and authorization events logged
- **Audit trail**: Complete audit trail for compliance and forensics

## 🔧 Security Configuration

### Multi-Factor Authentication Setup

1. **Enable MFA for users**:
   ```bash
   POST /api/auth/mfa/setup
   Authorization: Bearer <token>
   ```

2. **Verify setup with authenticator app**:
   ```bash
   POST /api/auth/mfa/verify-setup
   Content-Type: application/json
   {
     "token": "123456",
     "secret": "base32-secret"
   }
   ```

### OAuth 2.0 Configuration

1. **Configure OAuth provider** in `.env`:
   ```bash
   OAUTH_CLIENT_ID=your-client-id
   OAUTH_CLIENT_SECRET=your-client-secret
   OAUTH_AUTHORIZATION_URL=https://provider.com/oauth/authorize
   OAUTH_TOKEN_URL=https://provider.com/oauth/token
   ```

2. **Initiate OAuth flow**:
   ```bash
   GET /api/auth/oauth/authorize
   ```

### Database Security

For production PostgreSQL setup, see `backend/DATABASE_SECURITY.md` for:
- SSL configuration
- User privilege management
- Connection security
- Backup encryption
- Monitoring queries

### Automated Security Scanning

The repository includes automated security workflows:
- **Dependency scanning**: Daily Snyk and npm audit scans
- **Code analysis**: GitHub CodeQL for vulnerability detection
- **Secret scanning**: TruffleHog for exposed secrets
- **License compliance**: Automated license checking
- **Docker scanning**: Container vulnerability scanning

## 🔐 Security Incident Response

### Incident Types
1. **Authentication Breaches**: Unauthorized access attempts
2. **Data Exposure**: Potential data leaks or exposures
3. **System Compromise**: Suspected system intrusion
4. **Denial of Service**: Service disruption attacks

### Response Procedures
1. **Immediate containment**: Automatically block suspicious IPs
2. **Assessment**: Analyze logs and audit trails
3. **Notification**: Alert security team via configured channels
4. **Recovery**: Restore services and patch vulnerabilities
5. **Review**: Post-incident analysis and improvements

### Error Handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please:

1. Check the [Issues](https://github.com/rsl37/AI-Apartment-Rental-Search-Agent/issues) page
2. Review the API documentation above
3. Check the application logs for error details
4. Create a new issue with detailed information about your problem

## 🔮 Roadmap

### Phase 1 (Current)
- [x] Basic scraping and filtering
- [x] SMS notifications
- [x] REST API
- [x] React frontend
- [x] Daily reports

### Phase 2 (Next)
- [x] Multi-user authentication with RBAC
- [x] Advanced security features (MFA, OAuth, encryption)
- [ ] Advanced filtering and search
- [ ] Email notifications  
- [ ] Mobile app
- [ ] Real-time updates via WebSocket

### Phase 3 (Future)
- [ ] Machine learning price predictions
- [ ] Image analysis for apartment photos
- [ ] Integration with calendar apps
- [ ] Automated application submission
- [ ] Market trend analysis
- [ ] Advanced security monitoring and threat detection

---

**Built with ❤️ and 🛡️ security for apartment hunters in NYC**

## 📋 Security Compliance

This application implements security measures that align with industry standards:
- **OWASP Top 10**: Protection against common web vulnerabilities
- **SOC 2 Type II**: Security controls for data protection
- **GDPR**: Data privacy and protection compliance ready
- **PCI DSS**: Payment data security standards (when applicable)

For security questions or to report vulnerabilities, please contact: security@yourcompany.com
