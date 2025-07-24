import Joi from 'joi';

// User validation schemas
export const userRegistrationSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^\+?1?[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be a valid US phone number',
    }),
  alertPrefs: Joi.object({
    enableSMS: Joi.boolean().default(true),
    enableEmail: Joi.boolean().default(false),
    enablePush: Joi.boolean().default(false),
    dailyDigest: Joi.boolean().default(true),
    instantAlerts: Joi.boolean().default(false),
    priceDropAlerts: Joi.boolean().default(true),
    newListingAlerts: Joi.boolean().default(true),
    quietHours: Joi.object({
      start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }),
    maxAlertsPerDay: Joi.number().min(1).max(50).default(10),
    alertFilters: Joi.object({
      minPrice: Joi.number().min(0),
      maxPrice: Joi.number().min(0),
      bedrooms: Joi.array().items(Joi.number().min(0).max(5)),
      neighborhoods: Joi.array().items(Joi.string()),
    }),
  }).optional(),
});

export const userVerificationSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^\+?1?[0-9]{10}$/)
    .required(),
  verificationCode: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required(),
});

// Apartment validation schemas
export const apartmentCreateSchema = Joi.object({
  externalId: Joi.string().required(),
  source: Joi.string().valid('streeteasy', 'zillow', 'apartments').required(),
  url: Joi.string().uri().required(),
  title: Joi.string().min(1).max(500).required(),
  address: Joi.string().min(1).max(500).required(),
  neighborhood: Joi.string().max(100).optional(),
  borough: Joi.string().max(100).default('Manhattan'),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  price: Joi.number().min(0).required(),
  brokerFee: Joi.number().min(0).optional(),
  securityDeposit: Joi.number().min(0).optional(),
  bedrooms: Joi.number().min(0).max(10).required(),
  bathrooms: Joi.number().min(0).max(10).required(),
  sqft: Joi.number().min(0).optional(),
  floor: Joi.string().max(20).optional(),
  totalFloors: Joi.string().max(20).optional(),
  isDoorman: Joi.boolean().default(false),
  hasConcierge: Joi.boolean().default(false),
  hasAC: Joi.boolean().default(false),
  hasDishwasher: Joi.boolean().default(false),
  hasElevator: Joi.boolean().default(false),
  hasLaundryUnit: Joi.boolean().default(false),
  hasLaundryBuilding: Joi.boolean().default(false),
  isCatFriendly: Joi.boolean().default(false),
  availableFrom: Joi.date().optional(),
  availableTo: Joi.date().optional(),
  hasAsbestos: Joi.boolean().default(false),
  hasLeadPaint: Joi.boolean().default(false),
  hasBedbugs: Joi.boolean().default(false),
  hasMold: Joi.boolean().default(false),
  contactName: Joi.string().max(100).optional(),
  contactPhone: Joi.string().max(20).optional(),
  contactEmail: Joi.string().email().optional(),
  description: Joi.string().max(2000).optional(),
  images: Joi.array().items(Joi.string().uri()).default([]),
  features: Joi.array().items(Joi.string()).default([]),
});

export const apartmentFilterSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  sortBy: Joi.string().valid('price', 'createdAt', 'updatedAt', 'sqft', 'bedrooms', 'bathrooms').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  bedrooms: Joi.alternatives().try(
    Joi.number().min(0).max(10),
    Joi.array().items(Joi.number().min(0).max(10))
  ),
  bathrooms: Joi.number().min(0).max(10),
  minSqft: Joi.number().min(0),
  neighborhoods: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ),
  borough: Joi.string().default('Manhattan'),
  isDoorman: Joi.boolean(),
  hasConcierge: Joi.boolean(),
  hasAC: Joi.boolean(),
  hasDishwasher: Joi.boolean(),
  hasElevator: Joi.boolean(),
  hasLaundryUnit: Joi.boolean(),
  hasLaundryBuilding: Joi.boolean(),
  isCatFriendly: Joi.boolean(),
  availableFrom: Joi.date(),
  availableTo: Joi.date(),
  excludeHealthIssues: Joi.boolean().default(true),
  search: Joi.string().max(100),
});

// Notification validation schemas
export const notificationCreateSchema = Joi.object({
  userId: Joi.string().required(),
  type: Joi.string().valid('sms', 'email', 'push').required(),
  title: Joi.string().min(1).max(200).required(),
  message: Joi.string().min(1).max(1000).required(),
  payload: Joi.object().optional(),
});

// Report validation schemas
export const reportCreateSchema = Joi.object({
  date: Joi.date().default(() => new Date()),
  type: Joi.string().valid('daily', 'weekly', 'custom').default('daily'),
  totalListings: Joi.number().min(0).required(),
  newListings: Joi.number().min(0).required(),
  updatedListings: Joi.number().min(0).required(),
  removedListings: Joi.number().min(0).required(),
  averagePrice: Joi.number().min(0).required(),
  medianPrice: Joi.number().min(0).required(),
  lowestPrice: Joi.number().min(0).required(),
  highestPrice: Joi.number().min(0).required(),
  summary: Joi.string().max(1000).optional(),
  details: Joi.object().optional(),
  listings: Joi.array().items(Joi.string()).default([]),
  csvData: Joi.string().optional(),
  pdfUrl: Joi.string().uri().optional(),
});

// Validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }
    
    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      
      return res.status(400).json({
        error: 'Query validation failed',
        details: errors,
      });
    }
    
    req.query = value;
    next();
  };
};