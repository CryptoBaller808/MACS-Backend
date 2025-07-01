const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchainService');
const { validateRequest } = require('../middleware/validation');
const Joi = require('joi');
const logger = require('../utils/logger');

// Validation schemas
const walletAddressSchema = Joi.object({
  address: Joi.string().required(),
  chain: Joi.string().valid('polygon', 'solana').required()
});

const bridgeSchema = Joi.object({
  fromChain: Joi.string().valid('polygon', 'solana').required(),
  toChain: Joi.string().valid('polygon', 'solana').required(),
  amount: Joi.string().pattern(/^\d+(\.\d+)?$/).required(),
  fromAddress: Joi.string().required(),
  toAddress: Joi.string().required()
});

// GET /api/wallet/balance/:chain/:address
router.get('/balance/:chain/:address', async (req, res) => {
  try {
    const { chain, address } = req.params;

    // Validate chain
    if (!['polygon', 'solana'].includes(chain)) {
      return res.status(400).json({
        error: 'Invalid chain',
        message: 'Chain must be either polygon or solana'
      });
    }

    // Validate address format
    const isValidAddress = await blockchainService.validateWalletAddress(address, chain);
    if (!isValidAddress) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        message: `Invalid ${chain} wallet address format`
      });
    }

    let balance;
    if (chain === 'polygon') {
      balance = await blockchainService.getPolygonBalance(address);
    } else {
      balance = await blockchainService.getSolanaBalance(address);
    }

    res.json({
      success: true,
      data: {
        chain,
        address,
        ...balance,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error getting wallet balance:', error);
    res.status(500).json({
      error: 'Failed to get wallet balance',
      message: error.message
    });
  }
});

// GET /api/wallet/transactions/:chain/:address
router.get('/transactions/:chain/:address', async (req, res) => {
  try {
    const { chain, address } = req.params;
    const { limit = 50, cursor } = req.query;

    // Validate chain
    if (!['polygon', 'solana'].includes(chain)) {
      return res.status(400).json({
        error: 'Invalid chain',
        message: 'Chain must be either polygon or solana'
      });
    }

    // Validate address format
    const isValidAddress = await blockchainService.validateWalletAddress(address, chain);
    if (!isValidAddress) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        message: `Invalid ${chain} wallet address format`
      });
    }

    let transactions;
    if (chain === 'polygon') {
      transactions = await blockchainService.getPolygonTransactionHistory(address, parseInt(limit));
    } else {
      transactions = await blockchainService.getSolanaTransactionHistory(address, parseInt(limit));
    }

    res.json({
      success: true,
      data: {
        chain,
        address,
        ...transactions,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error getting transaction history:', error);
    res.status(500).json({
      error: 'Failed to get transaction history',
      message: error.message
    });
  }
});

// POST /api/wallet/validate
router.post('/validate', validateRequest(walletAddressSchema), async (req, res) => {
  try {
    const { address, chain } = req.body;

    const isValid = await blockchainService.validateWalletAddress(address, chain);

    res.json({
      success: true,
      data: {
        address,
        chain,
        isValid,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error validating wallet address:', error);
    res.status(500).json({
      error: 'Failed to validate wallet address',
      message: error.message
    });
  }
});

// GET /api/wallet/gas-estimate/:chain
router.get('/gas-estimate/:chain', async (req, res) => {
  try {
    const { chain } = req.params;
    const { from, to, amount } = req.query;

    if (chain !== 'polygon') {
      return res.status(400).json({
        error: 'Gas estimation only available for Polygon',
        message: 'Solana uses fixed fees'
      });
    }

    if (!from || !to || !amount) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'from, to, and amount are required'
      });
    }

    const gasEstimate = await blockchainService.estimatePolygonGas(from, to, amount);

    res.json({
      success: true,
      data: {
        chain,
        from,
        to,
        amount,
        ...gasEstimate,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error estimating gas:', error);
    res.status(500).json({
      error: 'Failed to estimate gas',
      message: error.message
    });
  }
});

// GET /api/wallet/price
router.get('/price', async (req, res) => {
  try {
    const price = await blockchainService.getTokenPrice();

    res.json({
      success: true,
      data: {
        token: 'MACS',
        ...price
      }
    });

  } catch (error) {
    logger.error('Error getting token price:', error);
    res.status(500).json({
      error: 'Failed to get token price',
      message: error.message
    });
  }
});

// GET /api/wallet/network-stats
router.get('/network-stats', async (req, res) => {
  try {
    const stats = await blockchainService.getNetworkStats();

    res.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error getting network stats:', error);
    res.status(500).json({
      error: 'Failed to get network stats',
      message: error.message
    });
  }
});

module.exports = router;

