const Joi = require('joi');
const logger = require('../utils/logger');

// Validation middleware factory
const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Validation error:', {
        endpoint: req.path,
        method: req.method,
        errors: errorDetails
      });

      return res.status(400).json({
        error: 'Validation failed',
        message: 'Request data is invalid',
        details: errorDetails
      });
    }

    // Replace request data with validated and sanitized data
    req[property] = value;
    next();
  };
};

// Common validation schemas
const commonSchemas = {
  // Pagination
  pagination: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
    sortBy: Joi.string().default('createdAt')
  }),

  // UUID validation
  uuid: Joi.string().uuid({ version: 'uuidv4' }),

  // Wallet address validation
  walletAddress: Joi.alternatives().try(
    // Ethereum/Polygon address
    Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/),
    // Solana address (base58, 32-44 characters)
    Joi.string().pattern(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)
  ),

  // Chain validation
  chain: Joi.string().valid('polygon', 'solana'),

  // Currency validation
  currency: Joi.string().valid('macs', 'usdt', 'usd', 'sol'),

  // Amount validation
  amount: Joi.number().positive().precision(8),

  // Date range validation
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
  }),

  // Search query validation
  search: Joi.object({
    q: Joi.string().min(1).max(100).trim(),
    category: Joi.string().valid('music', 'visual-art', 'performance', 'digital-art', 'traditional-art', 'cultural-heritage'),
    location: Joi.string().max(100),
    priceMin: Joi.number().min(0),
    priceMax: Joi.number().min(Joi.ref('priceMin'))
  })
};

// Validate query parameters
const validateQuery = (schema) => validateRequest(schema, 'query');

// Validate URL parameters
const validateParams = (schema) => validateRequest(schema, 'params');

// Validate headers
const validateHeaders = (schema) => validateRequest(schema, 'headers');

// Custom validation functions
const customValidators = {
  // Validate wallet signature format
  walletSignature: (value, helpers) => {
    if (typeof value !== 'string' || value.length < 64) {
      return helpers.error('any.invalid');
    }
    return value;
  },

  // Validate IPFS hash
  ipfsHash: (value, helpers) => {
    const ipfsRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
    if (!ipfsRegex.test(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  },

  // Validate social media URL
  socialUrl: (value, helpers) => {
    const socialDomains = [
      'twitter.com', 'instagram.com', 'facebook.com', 
      'linkedin.com', 'youtube.com', 'tiktok.com',
      'discord.gg', 'github.com'
    ];
    
    try {
      const url = new URL(value);
      const isValidDomain = socialDomains.some(domain => 
        url.hostname === domain || url.hostname.endsWith(`.${domain}`)
      );
      
      if (!isValidDomain) {
        return helpers.error('any.invalid');
      }
      
      return value;
    } catch {
      return helpers.error('any.invalid');
    }
  }
};

// Add custom validators to Joi
Object.keys(customValidators).forEach(name => {
  Joi.extend({
    type: name,
    base: Joi.string(),
    validate: customValidators[name]
  });
});

// Error handler for validation errors
const handleValidationError = (error, req, res, next) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      details: error.details
    });
  }
  next(error);
};

module.exports = {
  validateRequest,
  validateQuery,
  validateParams,
  validateHeaders,
  commonSchemas,
  handleValidationError
};

