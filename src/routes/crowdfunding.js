const express = require('express');
const router = express.Router();
const { validateRequest } = require('../middleware/validation');
const Joi = require('joi');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Validation schemas
const createCampaignSchema = Joi.object({
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().min(50).max(2000).required(),
  goal: Joi.number().positive().max(1000000).required(),
  currency: Joi.string().valid('macs', 'usdt', 'usd').required(),
  deadline: Joi.date().iso().min('now').required(),
  category: Joi.string().valid('music', 'visual-art', 'performance', 'digital-art', 'traditional-art', 'cultural-heritage').required(),
  rewards: Joi.array().items(
    Joi.object({
      tier: Joi.string().required(),
      amount: Joi.number().positive().required(),
      description: Joi.string().max(500).required(),
      deliverables: Joi.array().items(Joi.string()).required(),
      estimatedDelivery: Joi.date().iso().required(),
      limitedQuantity: Joi.number().integer().positive().optional()
    })
  ).min(1).max(10).required(),
  media: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('image', 'video').required(),
      url: Joi.string().uri().required(),
      caption: Joi.string().max(200).optional()
    })
  ).max(10).optional()
});

const contributionSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().valid('macs', 'usdt', 'usd').required(),
  rewardTier: Joi.string().optional(),
  message: Joi.string().max(500).optional(),
  anonymous: Joi.boolean().default(false),
  walletAddress: Joi.string().required()
});

const updateCampaignSchema = Joi.object({
  title: Joi.string().min(5).max(100).optional(),
  description: Joi.string().min(50).max(2000).optional(),
  updates: Joi.array().items(
    Joi.object({
      title: Joi.string().max(100).required(),
      content: Joi.string().max(1000).required(),
      media: Joi.array().items(Joi.string().uri()).optional()
    })
  ).optional()
});

// GET /api/crowdfunding/campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const { 
      category, 
      status = 'active', 
      sort = 'trending', 
      limit = 20, 
      offset = 0,
      search 
    } = req.query;

    // Mock campaigns data - in production, this would query the database
    const campaigns = {
      campaigns: [
        {
          id: uuidv4(),
          title: 'Traditional Maori Carving Documentation Project',
          description: 'Preserving ancient Maori carving techniques through digital documentation and educational content.',
          artistId: uuidv4(),
          artistName: 'Aroha Williams',
          artistAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
          category: 'cultural-heritage',
          goal: 15000,
          raised: 8750,
          currency: 'macs',
          backers: 127,
          deadline: '2025-02-15T23:59:59Z',
          status: 'active',
          featured: true,
          media: [
            {
              type: 'image',
              url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
              caption: 'Traditional Maori carving tools and techniques'
            }
          ],
          location: 'Auckland, New Zealand',
          createdAt: '2024-11-15T10:00:00Z'
        },
        {
          id: uuidv4(),
          title: 'Afrobeat Music Album Production',
          description: 'Creating a fusion album that blends traditional West African rhythms with modern production.',
          artistId: uuidv4(),
          artistName: 'Kwame Asante',
          artistAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
          category: 'music',
          goal: 25000,
          raised: 18200,
          currency: 'macs',
          backers: 203,
          deadline: '2025-01-30T23:59:59Z',
          status: 'active',
          featured: false,
          media: [
            {
              type: 'image',
              url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f',
              caption: 'Recording session with traditional instruments'
            }
          ],
          location: 'Accra, Ghana',
          createdAt: '2024-10-20T14:30:00Z'
        },
        {
          id: uuidv4(),
          title: 'Indigenous Textile Revival Workshop Series',
          description: 'Teaching traditional weaving techniques to preserve cultural heritage and empower local artisans.',
          artistId: uuidv4(),
          artistName: 'Maria Ixchel',
          artistAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
          category: 'traditional-art',
          goal: 12000,
          raised: 9840,
          currency: 'macs',
          backers: 156,
          deadline: '2025-03-10T23:59:59Z',
          status: 'active',
          featured: true,
          media: [
            {
              type: 'image',
              url: 'https://images.unsplash.com/photo-1582582621959-48d27397dc69',
              caption: 'Traditional textile patterns and techniques'
            }
          ],
          location: 'Guatemala City, Guatemala',
          createdAt: '2024-12-01T09:15:00Z'
        }
      ],
      pagination: {
        total: 3,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: false
      },
      filters: {
        categories: ['music', 'visual-art', 'performance', 'digital-art', 'traditional-art', 'cultural-heritage'],
        statuses: ['active', 'funded', 'completed', 'cancelled'],
        sortOptions: ['trending', 'newest', 'ending-soon', 'most-funded']
      }
    };

    res.json({
      success: true,
      data: campaigns
    });

  } catch (error) {
    logger.error('Error getting campaigns:', error);
    res.status(500).json({
      error: 'Failed to get campaigns',
      message: error.message
    });
  }
});

// POST /api/crowdfunding/campaigns
router.post('/campaigns', validateRequest(createCampaignSchema), async (req, res) => {
  try {
    const campaignData = req.body;
    const artistId = req.user.id; // From auth middleware

    // Generate campaign ID
    const campaignId = uuidv4();

    // Mock campaign creation - in production, this would:
    // 1. Validate artist profile
    // 2. Process media uploads
    // 3. Create smart contract escrow
    // 4. Save to database
    const campaign = {
      id: campaignId,
      artistId,
      ...campaignData,
      raised: 0,
      backers: 0,
      status: 'pending', // pending, active, funded, completed, cancelled
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Log campaign creation
    logger.info('Campaign created:', {
      campaignId,
      artistId,
      title: campaignData.title,
      goal: campaignData.goal,
      currency: campaignData.currency
    });

    res.status(201).json({
      success: true,
      data: campaign
    });

  } catch (error) {
    logger.error('Error creating campaign:', error);
    res.status(500).json({
      error: 'Failed to create campaign',
      message: error.message
    });
  }
});

// GET /api/crowdfunding/campaigns/:campaignId
router.get('/campaigns/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Mock campaign details - in production, this would query the database
    const campaign = {
      id: campaignId,
      title: 'Traditional Maori Carving Documentation Project',
      description: 'Preserving ancient Maori carving techniques through digital documentation and educational content. This project aims to create a comprehensive digital archive of traditional Maori carving methods, tools, and cultural significance.',
      artistId: uuidv4(),
      artistName: 'Aroha Williams',
      artistAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
      artistBio: 'Master carver with 20+ years of experience in traditional Maori art forms.',
      category: 'cultural-heritage',
      goal: 15000,
      raised: 8750,
      currency: 'macs',
      backers: 127,
      deadline: '2025-02-15T23:59:59Z',
      status: 'active',
      featured: true,
      location: 'Auckland, New Zealand',
      media: [
        {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
          caption: 'Traditional Maori carving tools and techniques'
        },
        {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1582582621959-48d27397dc69',
          caption: 'Intricate wood carving details'
        }
      ],
      rewards: [
        {
          tier: 'Supporter',
          amount: 25,
          description: 'Digital thank you card and project updates',
          deliverables: ['Digital thank you card', 'Monthly updates'],
          estimatedDelivery: '2025-03-01T00:00:00Z',
          backers: 45
        },
        {
          tier: 'Patron',
          amount: 100,
          description: 'Digital documentation access and virtual workshop',
          deliverables: ['Complete digital archive access', 'Virtual carving workshop', 'Digital certificate'],
          estimatedDelivery: '2025-04-01T00:00:00Z',
          backers: 32
        },
        {
          tier: 'Collector',
          amount: 500,
          description: 'Hand-carved piece and exclusive content',
          deliverables: ['Small hand-carved piece', 'Behind-the-scenes content', 'Personal video message'],
          estimatedDelivery: '2025-05-01T00:00:00Z',
          limitedQuantity: 20,
          backers: 8
        }
      ],
      updates: [
        {
          id: uuidv4(),
          title: 'Project Milestone: 50% Funded!',
          content: 'We\'ve reached 50% of our funding goal! Thank you to all our amazing backers. Work has begun on documenting the traditional tools and their uses.',
          media: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96'],
          createdAt: '2024-12-15T10:00:00Z'
        },
        {
          id: uuidv4(),
          title: 'Elder Interview Sessions Begin',
          content: 'We\'ve started conducting interviews with master carvers to capture their knowledge and stories.',
          createdAt: '2024-12-10T14:30:00Z'
        }
      ],
      createdAt: '2024-11-15T10:00:00Z',
      updatedAt: '2024-12-15T10:00:00Z'
    };

    res.json({
      success: true,
      data: campaign
    });

  } catch (error) {
    logger.error('Error getting campaign:', error);
    res.status(500).json({
      error: 'Failed to get campaign',
      message: error.message
    });
  }
});

// POST /api/crowdfunding/campaigns/:campaignId/contribute
router.post('/campaigns/:campaignId/contribute', validateRequest(contributionSchema), async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { amount, currency, rewardTier, message, anonymous, walletAddress } = req.body;
    const contributorId = req.user.id;

    // Generate contribution ID
    const contributionId = uuidv4();

    // Mock contribution creation - in production, this would:
    // 1. Validate campaign is active
    // 2. Process payment
    // 3. Update campaign totals
    // 4. Handle reward tier allocation
    // 5. Send notifications
    const contribution = {
      id: contributionId,
      campaignId,
      contributorId,
      amount,
      currency,
      rewardTier,
      message,
      anonymous,
      walletAddress,
      status: 'completed', // pending, completed, failed, refunded
      transactionHash: '0x' + Math.random().toString(16).substr(2, 40),
      createdAt: new Date().toISOString()
    };

    // Log contribution
    logger.info('Contribution made:', {
      contributionId,
      campaignId,
      contributorId,
      amount,
      currency
    });

    res.status(201).json({
      success: true,
      data: contribution
    });

  } catch (error) {
    logger.error('Error creating contribution:', error);
    res.status(500).json({
      error: 'Failed to create contribution',
      message: error.message
    });
  }
});

// GET /api/crowdfunding/campaigns/:campaignId/contributions
router.get('/campaigns/:campaignId/contributions', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Mock contributions data - in production, this would query the database
    const contributions = {
      contributions: [
        {
          id: uuidv4(),
          contributorName: 'Anonymous',
          contributorAvatar: null,
          amount: 100,
          currency: 'macs',
          rewardTier: 'Patron',
          message: 'Love supporting cultural preservation projects!',
          anonymous: true,
          createdAt: '2024-12-20T15:30:00Z'
        },
        {
          id: uuidv4(),
          contributorName: 'Sarah Chen',
          contributorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786',
          amount: 25,
          currency: 'macs',
          rewardTier: 'Supporter',
          message: 'Excited to learn about Maori carving traditions!',
          anonymous: false,
          createdAt: '2024-12-19T09:15:00Z'
        },
        {
          id: uuidv4(),
          contributorName: 'Michael Torres',
          contributorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
          amount: 500,
          currency: 'macs',
          rewardTier: 'Collector',
          message: 'As a fellow artist, I deeply appreciate this work.',
          anonymous: false,
          createdAt: '2024-12-18T20:45:00Z'
        }
      ],
      pagination: {
        total: 127,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: true
      },
      summary: {
        totalRaised: 8750,
        totalBackers: 127,
        averageContribution: 68.9,
        topContribution: 500
      }
    };

    res.json({
      success: true,
      data: contributions
    });

  } catch (error) {
    logger.error('Error getting contributions:', error);
    res.status(500).json({
      error: 'Failed to get contributions',
      message: error.message
    });
  }
});

// PUT /api/crowdfunding/campaigns/:campaignId
router.put('/campaigns/:campaignId', validateRequest(updateCampaignSchema), async (req, res) => {
  try {
    const { campaignId } = req.params;
    const updates = req.body;
    const artistId = req.user.id;

    // Mock campaign update - in production, this would:
    // 1. Validate user owns the campaign
    // 2. Validate campaign can be updated
    // 3. Process updates
    // 4. Notify backers if significant changes
    const updatedCampaign = {
      id: campaignId,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: artistId
    };

    // Log campaign update
    logger.info('Campaign updated:', {
      campaignId,
      artistId,
      updates: Object.keys(updates)
    });

    res.json({
      success: true,
      data: updatedCampaign
    });

  } catch (error) {
    logger.error('Error updating campaign:', error);
    res.status(500).json({
      error: 'Failed to update campaign',
      message: error.message
    });
  }
});

// GET /api/crowdfunding/user/campaigns
router.get('/user/campaigns', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;

    // Mock user campaigns - in production, this would query the database
    const campaigns = {
      campaigns: [
        {
          id: uuidv4(),
          title: 'Digital Art NFT Collection',
          goal: 10000,
          raised: 7500,
          currency: 'macs',
          backers: 89,
          status: 'active',
          deadline: '2025-01-15T23:59:59Z',
          createdAt: '2024-11-01T10:00:00Z'
        }
      ],
      pagination: {
        total: 1,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: false
      }
    };

    res.json({
      success: true,
      data: campaigns
    });

  } catch (error) {
    logger.error('Error getting user campaigns:', error);
    res.status(500).json({
      error: 'Failed to get user campaigns',
      message: error.message
    });
  }
});

// GET /api/crowdfunding/stats
router.get('/stats', async (req, res) => {
  try {
    // Mock crowdfunding statistics - in production, this would aggregate from database
    const stats = {
      totalCampaigns: 1247,
      activeCampaigns: 342,
      totalRaised: {
        macs: '2100000',
        usd: '4200000'
      },
      totalBackers: 28450,
      successRate: 78.5,
      averageFunding: 3420,
      topCategories: [
        { category: 'music', campaigns: 387, raised: 890000 },
        { category: 'visual-art', campaigns: 298, raised: 650000 },
        { category: 'cultural-heritage', campaigns: 156, raised: 420000 }
      ],
      monthlyStats: [
        { month: '2024-06', campaigns: 89, raised: 245000 },
        { month: '2024-07', campaigns: 102, raised: 298000 },
        { month: '2024-08', campaigns: 95, raised: 267000 },
        { month: '2024-09', campaigns: 118, raised: 334000 },
        { month: '2024-10', campaigns: 134, raised: 389000 },
        { month: '2024-11', campaigns: 142, raised: 412000 },
        { month: '2024-12', campaigns: 156, raised: 456000 }
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
    logger.error('Error getting crowdfunding stats:', error);
    res.status(500).json({
      error: 'Failed to get crowdfunding stats',
      message: error.message
    });
  }
});

module.exports = router;

