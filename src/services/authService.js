const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'macs-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthService {
  // Generate JWT token
  generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'macs-api',
      audience: 'macs-platform'
    });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'macs-api',
        audience: 'macs-platform'
      });
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Hash password
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Generate wallet nonce for signature verification
  generateWalletNonce() {
    return Math.floor(Math.random() * 1000000).toString();
  }

  // Verify wallet signature (simplified - in production use proper signature verification)
  async verifyWalletSignature(address, signature, message, chain) {
    try {
      // This is a simplified verification
      // In production, you would use ethers.js for Ethereum/Polygon
      // and @solana/web3.js for Solana signature verification
      
      if (chain === 'polygon') {
        // Ethereum signature verification would go here
        return true; // Simplified for demo
      } else if (chain === 'solana') {
        // Solana signature verification would go here
        return true; // Simplified for demo
      }
      
      return false;
    } catch (error) {
      logger.error('Wallet signature verification failed:', error);
      return false;
    }
  }

  // Create user session
  async createSession(user) {
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      isArtist: user.isArtist,
      isVerified: user.isVerified
    };

    const token = this.generateToken(payload);
    
    return {
      token,
      user: payload,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  // Validate username
  validateUsername(username) {
    // 3-30 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
  }

  // Generate API key
  generateApiKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'macs_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Hash API key for storage
  async hashApiKey(apiKey) {
    return await this.hashPassword(apiKey);
  }

  // Rate limiting check (simplified)
  async checkRateLimit(identifier, limit = 100, window = 3600) {
    // In production, this would use Redis or similar
    // For now, return true (no rate limiting)
    return true;
  }
}

module.exports = new AuthService();

