const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchainService');
const { validateRequest } = require('../middleware/validation');
const Joi = require('joi');
const logger = require('../utils/logger');

// Validation schemas
const bridgeInitiateSchema = Joi.object({
  fromChain: Joi.string().valid('polygon', 'solana').required(),
  toChain: Joi.string().valid('polygon', 'solana').required(),
  amount: Joi.string().pattern(/^\d+(\.\d+)?$/).required(),
  fromAddress: Joi.string().required(),
  toAddress: Joi.string().required()
}).custom((value, helpers) => {
  if (value.fromChain === value.toChain) {
    return helpers.error('any.invalid', { message: 'fromChain and toChain must be different' });
  }
  return value;
});

const bridgeStatusSchema = Joi.object({
  bridgeId: Joi.string().required()
});

// GET /api/bridge/fee
router.get('/fee', async (req, res) => {
  try {
    const { fromChain, toChain } = req.query;

    if (!fromChain || !toChain) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'fromChain and toChain are required'
      });
    }

    if (!['polygon', 'solana'].includes(fromChain) || !['polygon', 'solana'].includes(toChain)) {
      return res.status(400).json({
        error: 'Invalid chain',
        message: 'Chains must be either polygon or solana'
      });
    }

    if (fromChain === toChain) {
      return res.status(400).json({
        error: 'Invalid bridge request',
        message: 'fromChain and toChain must be different'
      });
    }

    const fee = await blockchainService.getBridgeFee(fromChain, toChain);

    res.json({
      success: true,
      data: {
        fromChain,
        toChain,
        ...fee,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error getting bridge fee:', error);
    res.status(500).json({
      error: 'Failed to get bridge fee',
      message: error.message
    });
  }
});

// POST /api/bridge/initiate
router.post('/initiate', validateRequest(bridgeInitiateSchema), async (req, res) => {
  try {
    const { fromChain, toChain, amount, fromAddress, toAddress } = req.body;

    // Validate wallet addresses
    const isValidFromAddress = await blockchainService.validateWalletAddress(fromAddress, fromChain);
    const isValidToAddress = await blockchainService.validateWalletAddress(toAddress, toChain);

    if (!isValidFromAddress) {
      return res.status(400).json({
        error: 'Invalid from address',
        message: `Invalid ${fromChain} wallet address format`
      });
    }

    if (!isValidToAddress) {
      return res.status(400).json({
        error: 'Invalid to address',
        message: `Invalid ${toChain} wallet address format`
      });
    }

    // Check minimum bridge amount
    const minAmount = parseFloat(process.env.MIN_BRIDGE_AMOUNT || '1');
    if (parseFloat(amount) < minAmount) {
      return res.status(400).json({
        error: 'Amount too low',
        message: `Minimum bridge amount is ${minAmount} MACS`
      });
    }

    // Check maximum bridge amount
    const maxAmount = parseFloat(process.env.MAX_BRIDGE_AMOUNT || '10000');
    if (parseFloat(amount) > maxAmount) {
      return res.status(400).json({
        error: 'Amount too high',
        message: `Maximum bridge amount is ${maxAmount} MACS`
      });
    }

    // Initiate bridge transaction
    const bridgeResult = await blockchainService.initiateBridge(
      fromChain,
      toChain,
      amount,
      fromAddress,
      toAddress
    );

    // Log bridge initiation
    logger.info('Bridge initiated:', {
      bridgeId: bridgeResult.bridgeId,
      fromChain,
      toChain,
      amount,
      fromAddress,
      toAddress,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: bridgeResult
    });

  } catch (error) {
    logger.error('Error initiating bridge:', error);
    res.status(500).json({
      error: 'Failed to initiate bridge',
      message: error.message
    });
  }
});

// GET /api/bridge/status/:bridgeId
router.get('/status/:bridgeId', async (req, res) => {
  try {
    const { bridgeId } = req.params;

    if (!bridgeId) {
      return res.status(400).json({
        error: 'Missing bridge ID',
        message: 'Bridge ID is required'
      });
    }

    const status = await blockchainService.getBridgeStatus(bridgeId);

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    logger.error('Error getting bridge status:', error);
    res.status(500).json({
      error: 'Failed to get bridge status',
      message: error.message
    });
  }
});

// GET /api/bridge/history/:address
router.get('/history/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // In production, this would query the database for bridge transactions
    // For now, return mock data structure
    const bridgeHistory = {
      transactions: [
        {
          bridgeId: 'bridge_1703123456_abc123',
          fromChain: 'polygon',
          toChain: 'solana',
          amount: '100.0',
          fromAddress: address,
          toAddress: 'DQYrAc...2Vhc',
          status: 'completed',
          initiatedAt: '2024-12-21T10:30:00Z',
          completedAt: '2024-12-21T10:35:00Z',
          fee: '0.001',
          transactionHashes: {
            source: '0x1234...5678',
            destination: '5KJp...9XYZ'
          }
        },
        {
          bridgeId: 'bridge_1703023456_def456',
          fromChain: 'solana',
          toChain: 'polygon',
          amount: '50.0',
          fromAddress: 'DQYrAc...2Vhc',
          toAddress: address,
          status: 'completed',
          initiatedAt: '2024-12-20T15:20:00Z',
          completedAt: '2024-12-20T15:28:00Z',
          fee: '0.001',
          transactionHashes: {
            source: '9ABC...DEF1',
            destination: '0x9876...5432'
          }
        }
      ],
      pagination: {
        total: 2,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: false
      }
    };

    res.json({
      success: true,
      data: bridgeHistory
    });

  } catch (error) {
    logger.error('Error getting bridge history:', error);
    res.status(500).json({
      error: 'Failed to get bridge history',
      message: error.message
    });
  }
});

// GET /api/bridge/stats
router.get('/stats', async (req, res) => {
  try {
    // In production, this would aggregate data from the database
    const stats = {
      totalVolume: '2100000',
      totalTransactions: 15420,
      averageFee: '0.001',
      averageTime: '5.2', // minutes
      successRate: 99.8,
      chainDistribution: {
        'polygon-to-solana': 8750,
        'solana-to-polygon': 6670
      },
      dailyVolume: [
        { date: '2024-12-15', volume: 45000 },
        { date: '2024-12-16', volume: 52000 },
        { date: '2024-12-17', volume: 48000 },
        { date: '2024-12-18', volume: 61000 },
        { date: '2024-12-19', volume: 55000 },
        { date: '2024-12-20', volume: 58000 },
        { date: '2024-12-21', volume: 62000 }
      ]
    };

    res.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error getting bridge stats:', error);
    res.status(500).json({
      error: 'Failed to get bridge stats',
      message: error.message
    });
  }
});

// GET /api/bridge/supported-chains
router.get('/supported-chains', (req, res) => {
  try {
    const supportedChains = {
      chains: [
        {
          id: 'polygon',
          name: 'Polygon',
          chainId: 137,
          nativeCurrency: 'MATIC',
          rpcUrl: process.env.POLYGON_RPC_URL,
          blockExplorer: 'https://polygonscan.com',
          bridgeEnabled: true
        },
        {
          id: 'solana',
          name: 'Solana',
          cluster: 'mainnet-beta',
          nativeCurrency: 'SOL',
          rpcUrl: process.env.SOLANA_RPC_URL,
          blockExplorer: 'https://explorer.solana.com',
          bridgeEnabled: true
        }
      ],
      bridgePairs: [
        { from: 'polygon', to: 'solana', enabled: true },
        { from: 'solana', to: 'polygon', enabled: true }
      ]
    };

    res.json({
      success: true,
      data: supportedChains
    });

  } catch (error) {
    logger.error('Error getting supported chains:', error);
    res.status(500).json({
      error: 'Failed to get supported chains',
      message: error.message
    });
  }
});

module.exports = router;

