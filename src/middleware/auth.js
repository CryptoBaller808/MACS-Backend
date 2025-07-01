const authService = require('../services/authService');
const logger = require('../utils/logger');

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No authorization header provided'
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = authService.verifyToken(token);
    
    // In production, you might want to check if user still exists in database
    // and if the token hasn't been revoked
    
    // Attach user info to request
    req.user = decoded;
    
    // Log authenticated request
    logger.debug('Authenticated request:', {
      userId: decoded.id,
      endpoint: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    logger.error('Authentication failed:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please log in again'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Please provide a valid authentication token'
      });
    }

    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      if (token) {
        const decoded = authService.verifyToken(token);
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    // Don't fail on optional auth, just continue without user
    logger.debug('Optional auth failed:', error.message);
    next();
  }
};

// Artist role middleware
const artistMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }

  if (!req.user.isArtist) {
    return res.status(403).json({
      error: 'Artist access required',
      message: 'This endpoint requires artist privileges'
    });
  }

  next();
};

// Admin role middleware
const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }

  // In production, you'd have an admin role check
  if (!req.user.isAdmin) {
    return res.status(403).json({
      error: 'Admin access required',
      message: 'This endpoint requires administrator privileges'
    });
  }

  next();
};

// Wallet verification middleware
const walletMiddleware = async (req, res, next) => {
  try {
    const walletAddress = req.headers['x-wallet-address'];
    const chainId = req.headers['x-chain-id'];
    
    if (!walletAddress || !chainId) {
      return res.status(400).json({
        error: 'Wallet verification required',
        message: 'Wallet address and chain ID headers are required'
      });
    }

    // Validate wallet address format
    const chain = chainId === '137' ? 'polygon' : 'solana';
    const isValid = await require('../services/blockchainService').validateWalletAddress(walletAddress, chain);
    
    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        message: 'Please provide a valid wallet address'
      });
    }

    // Attach wallet info to request
    req.wallet = {
      address: walletAddress,
      chain,
      chainId
    };

    next();
  } catch (error) {
    logger.error('Wallet verification failed:', error);
    return res.status(500).json({
      error: 'Wallet verification failed',
      message: error.message
    });
  }
};

// API key middleware
const apiKeyMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        message: 'Please provide a valid API key'
      });
    }

    // In production, verify API key against database
    // For now, just check if it starts with 'macs_'
    if (!apiKey.startsWith('macs_')) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'Please provide a valid MACS API key'
      });
    }

    // Attach API key info to request
    req.apiKey = {
      key: apiKey,
      permissions: ['read', 'write'] // In production, get from database
    };

    next();
  } catch (error) {
    logger.error('API key verification failed:', error);
    return res.status(500).json({
      error: 'API key verification failed',
      message: error.message
    });
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  artistMiddleware,
  adminMiddleware,
  walletMiddleware,
  apiKeyMiddleware
};

