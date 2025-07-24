# AI Apartment Rental Agent

A full-stack web application that automatically scrapes apartment listings from StreetEasy, Zillow, Apartments.com, Redfin, and Trulia, filters them based on specific criteria, and sends SMS notifications to verified users about new listings.

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
- `JWT_SECRET`: Secret for JWT token signing

#### Required for Scraping
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

1. **Scrapes** apartment listings from StreetEasy, Zillow, Apartments.com, Redfin, and Trulia
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
DATABASE_URL="postgresql://user:password@host:port/database"
CORS_ORIGIN="https://your-frontend-domain.com"

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

### Logging

The application uses Winston for structured logging:

- **Development**: Console output with colors
- **Production**: File-based logging (`logs/` directory)
- **Levels**: error, warn, info, http, debug

### Error Handling

- **Global error handler**: Catches and logs all unhandled errors
- **API errors**: Consistent error response format
- **Validation errors**: Detailed field-level validation messages

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
- [ ] Multi-user authentication
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

---

**Built with ❤️ for apartment hunters in NYC**