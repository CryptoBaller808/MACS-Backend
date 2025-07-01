const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { validateRequest } = require('../middleware/validation');
const Joi = require('joi');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/).required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  isArtist: Joi.boolean().default(false),
  profileData: Joi.object({
    displayName: Joi.string().max(100),
    bio: Joi.string().max(500),
    location: Joi.string().max(100),
    website: Joi.string().uri(),
    artistCategories: Joi.array().items(Joi.string()).when('...isArtist', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const walletLoginSchema = Joi.object({
  walletAddress: Joi.string().required(),
  signature: Joi.string().required(),
  message: Joi.string().required(),
  chain: Joi.string().valid('polygon', 'solana').required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
});

// POST /api/auth/register
router.post('/register', validateRequest(registerSchema), async (req, res) => {
  try {
    const { email, username, password, isArtist, profileData } = req.body;

    // Validate email format
    if (!authService.validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    // Validate password strength
    if (!authService.validatePassword(password)) {
      return res.status(400).json({
        error: 'Weak password',
        message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
      });
    }

    // Validate username
    if (!authService.validateUsername(username)) {
      return res.status(400).json({
        error: 'Invalid username',
        message: 'Username must be 3-30 characters, alphanumeric and underscores only'
      });
    }

    // Check if user already exists (mock check)
    // In production, this would query the database
    const existingUser = null; // Mock: no existing user

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email or username already exists'
      });
    }

    // Hash password
    const passwordHash = await authService.hashPassword(password);

    // Create user (mock creation)
    const userId = uuidv4();
    const user = {
      id: userId,
      email,
      username,
      passwordHash,
      isArtist,
      isVerified: false,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      ...profileData
    };

    // Create session
    const session = await authService.createSession(user);

    // Log registration
    logger.info('User registered:', {
      userId,
      email,
      username,
      isArtist
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isArtist: user.isArtist,
          isVerified: user.isVerified
        },
        token: session.token,
        expiresAt: session.expiresAt
      }
    });

  } catch (error) {
    logger.error('Registration failed:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

// POST /api/auth/login
router.post('/login', validateRequest(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user (mock user)
    // In production, this would query the database
    const user = {
      id: uuidv4(),
      email,
      username: 'testuser',
      passwordHash: await authService.hashPassword(password), // Mock: password matches
      isArtist: true,
      isVerified: true,
      emailVerified: true,
      lastLoginAt: new Date().toISOString()
    };

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Verify password
    const isValidPassword = await authService.comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Create session
    const session = await authService.createSession(user);

    // Log login
    logger.info('User logged in:', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isArtist: user.isArtist,
          isVerified: user.isVerified
        },
        token: session.token,
        expiresAt: session.expiresAt
      }
    });

  } catch (error) {
    logger.error('Login failed:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// POST /api/auth/wallet-login
router.post('/wallet-login', validateRequest(walletLoginSchema), async (req, res) => {
  try {
    const { walletAddress, signature, message, chain } = req.body;

    // Verify wallet signature
    const isValidSignature = await authService.verifyWalletSignature(
      walletAddress,
      signature,
      message,
      chain
    );

    if (!isValidSignature) {
      return res.status(401).json({
        error: 'Invalid signature',
        message: 'Wallet signature verification failed'
      });
    }

    // Find or create user by wallet address (mock)
    // In production, this would query the database
    let user = {
      id: uuidv4(),
      email: null,
      username: `user_${walletAddress.slice(-8)}`,
      walletAddresses: { [chain]: walletAddress },
      isArtist: false,
      isVerified: false,
      emailVerified: false,
      createdAt: new Date().toISOString()
    };

    // Create session
    const session = await authService.createSession(user);

    // Log wallet login
    logger.info('Wallet login:', {
      userId: user.id,
      walletAddress,
      chain
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          walletAddress,
          chain,
          isArtist: user.isArtist,
          isVerified: user.isVerified
        },
        token: session.token,
        expiresAt: session.expiresAt
      }
    });

  } catch (error) {
    logger.error('Wallet login failed:', error);
    res.status(500).json({
      error: 'Wallet login failed',
      message: error.message
    });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    // In production, you might want to blacklist the token
    // For now, just return success
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout failed:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: error.message
    });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user details (mock)
    // In production, this would query the database
    const user = {
      id: userId,
      email: req.user.email,
      username: req.user.username,
      isArtist: req.user.isArtist,
      isVerified: req.user.isVerified,
      profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786',
      bio: 'Digital artist and cultural preservationist',
      location: 'San Francisco, CA',
      walletAddresses: {
        polygon: '0x742d35Cc6634C0532925a3b8D4C9db96590c4C87',
        solana: 'DQYrAcVMFiW2Vhc8j9nKQP3mX7sL4tR9eB6wN8uY2Vhc'
      },
      createdAt: '2024-01-15T10:00:00Z',
      lastLoginAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error('Get user profile failed:', error);
    res.status(500).json({
      error: 'Failed to get user profile',
      message: error.message
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    // Create new session
    const session = await authService.createSession(user);

    res.json({
      success: true,
      data: {
        token: session.token,
        expiresAt: session.expiresAt
      }
    });

  } catch (error) {
    logger.error('Token refresh failed:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: error.message
    });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', validateRequest(resetPasswordSchema), async (req, res) => {
  try {
    const { email } = req.body;

    // In production, this would:
    // 1. Check if user exists
    // 2. Generate reset token
    // 3. Send email with reset link
    // 4. Store reset token in database

    // For now, just return success
    res.json({
      success: true,
      message: 'Password reset email sent if account exists'
    });

  } catch (error) {
    logger.error('Password reset failed:', error);
    res.status(500).json({
      error: 'Password reset failed',
      message: error.message
    });
  }
});

// POST /api/auth/change-password
router.post('/change-password', 
  require('../middleware/auth').authMiddleware,
  validateRequest(changePasswordSchema),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Get user's current password hash (mock)
      const user = { passwordHash: 'mock-hash' };

      // Verify current password
      const isValidPassword = await authService.comparePassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({
          error: 'Invalid current password',
          message: 'Current password is incorrect'
        });
      }

      // Validate new password
      if (!authService.validatePassword(newPassword)) {
        return res.status(400).json({
          error: 'Weak password',
          message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
        });
      }

      // Hash new password
      const newPasswordHash = await authService.hashPassword(newPassword);

      // Update password in database (mock)
      // In production, this would update the database

      // Log password change
      logger.info('Password changed:', { userId });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      logger.error('Password change failed:', error);
      res.status(500).json({
        error: 'Password change failed',
        message: error.message
      });
    }
  }
);

// GET /api/auth/wallet-nonce/:address
router.get('/wallet-nonce/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { chain } = req.query;

    // Validate wallet address
    const isValid = await require('../services/blockchainService').validateWalletAddress(address, chain);
    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        message: 'Please provide a valid wallet address'
      });
    }

    // Generate nonce
    const nonce = authService.generateWalletNonce();

    // In production, store nonce in database with expiration
    
    res.json({
      success: true,
      data: {
        nonce,
        message: `Sign this message to authenticate with MACS: ${nonce}`,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      }
    });

  } catch (error) {
    logger.error('Nonce generation failed:', error);
    res.status(500).json({
      error: 'Nonce generation failed',
      message: error.message
    });
  }
});

module.exports = router;

