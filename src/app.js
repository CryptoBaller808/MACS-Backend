const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const bookingRoutes = require('./routes/booking');
const crowdfundingRoutes = require('./routes/crowdfunding');
const bridgeRoutes = require('./routes/bridge');
const userRoutes = require('./routes/user');
const transactionRoutes = require('./routes/transaction');

// Import middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://polygon-rpc.com", "https://api.mainnet-beta.solana.com"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://wallet.macs.art', 'https://macs.art']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5176', 'http://localhost:5177'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Wallet-Address', 'X-Chain-ID']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', authMiddleware, walletRoutes);
app.use('/api/booking', authMiddleware, bookingRoutes);
app.use('/api/crowdfunding', authMiddleware, crowdfundingRoutes);
app.use('/api/bridge', authMiddleware, bridgeRoutes);
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/transaction', authMiddleware, transactionRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'MACS Backend API',
    version: '1.0.0',
    description: 'Backend API for Muse Art Creative Sphere - Multichain wallet, booking, and crowdfunding platform',
    endpoints: {
      auth: '/api/auth',
      wallet: '/api/wallet',
      booking: '/api/booking',
      crowdfunding: '/api/crowdfunding',
      bridge: '/api/bridge',
      user: '/api/user',
      transaction: '/api/transaction'
    },
    documentation: '/docs',
    health: '/health'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: ['/api', '/health', '/docs']
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 MACS Backend API server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api`);
  logger.info(`❤️  Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;

