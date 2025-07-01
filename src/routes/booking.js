const express = require('express');
const router = express.Router();
const { validateRequest } = require('../middleware/validation');
const Joi = require('joi');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Validation schemas
const createBookingSchema = Joi.object({
  artistId: Joi.string().uuid().required(),
  serviceId: Joi.string().uuid().required(),
  date: Joi.date().iso().min('now').required(),
  duration: Joi.number().integer().min(30).max(480).required(), // 30 minutes to 8 hours
  message: Joi.string().max(500).optional(),
  paymentMethod: Joi.string().valid('macs', 'usdt', 'fiat').required(),
  walletAddress: Joi.string().when('paymentMethod', {
    is: Joi.valid('macs', 'usdt'),
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const updateBookingSchema = Joi.object({
  status: Joi.string().valid('confirmed', 'cancelled', 'completed', 'rescheduled').optional(),
  date: Joi.date().iso().min('now').optional(),
  duration: Joi.number().integer().min(30).max(480).optional(),
  message: Joi.string().max(500).optional()
});

const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional()
});

// GET /api/booking/artist/:artistId/availability
router.get('/artist/:artistId/availability', async (req, res) => {
  try {
    const { artistId } = req.params;
    const { date, duration = 60 } = req.query;

    // Validate artist ID format
    if (!artistId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        error: 'Invalid artist ID',
        message: 'Artist ID must be a valid UUID'
      });
    }

    // Mock availability data - in production, this would query the database
    const availability = {
      artistId,
      date: date || new Date().toISOString().split('T')[0],
      timeSlots: [
        { time: '09:00', available: true, duration: parseInt(duration) },
        { time: '10:00', available: true, duration: parseInt(duration) },
        { time: '11:00', available: false, duration: parseInt(duration) },
        { time: '14:00', available: true, duration: parseInt(duration) },
        { time: '15:00', available: true, duration: parseInt(duration) },
        { time: '16:00', available: false, duration: parseInt(duration) }
      ],
      timezone: 'UTC',
      workingHours: {
        start: '09:00',
        end: '17:00'
      }
    };

    res.json({
      success: true,
      data: availability
    });

  } catch (error) {
    logger.error('Error getting artist availability:', error);
    res.status(500).json({
      error: 'Failed to get availability',
      message: error.message
    });
  }
});

// GET /api/booking/artist/:artistId/services
router.get('/artist/:artistId/services', async (req, res) => {
  try {
    const { artistId } = req.params;

    // Mock services data - in production, this would query the database
    const services = {
      artistId,
      services: [
        {
          id: uuidv4(),
          name: 'Digital Art Consultation',
          description: 'One-on-one consultation for digital art projects and techniques',
          duration: 60,
          price: {
            macs: '85',
            usd: '170'
          },
          category: 'consultation',
          deliverables: ['Personalized advice', 'Resource recommendations', 'Follow-up notes'],
          requirements: ['Portfolio review', 'Project brief']
        },
        {
          id: uuidv4(),
          name: 'Custom Digital Artwork',
          description: 'Commission a unique digital artwork piece',
          duration: 240,
          price: {
            macs: '500',
            usd: '1000'
          },
          category: 'commission',
          deliverables: ['High-resolution artwork', 'Process documentation', 'Commercial license'],
          requirements: ['Detailed brief', '50% upfront payment']
        },
        {
          id: uuidv4(),
          name: 'Cultural Art Workshop',
          description: 'Interactive workshop on traditional and digital art fusion',
          duration: 150,
          price: {
            macs: '150',
            usd: '300'
          },
          category: 'workshop',
          deliverables: ['Live instruction', 'Resource materials', 'Recording access'],
          requirements: ['Basic art supplies', 'Stable internet connection']
        }
      ]
    };

    res.json({
      success: true,
      data: services
    });

  } catch (error) {
    logger.error('Error getting artist services:', error);
    res.status(500).json({
      error: 'Failed to get services',
      message: error.message
    });
  }
});

// POST /api/booking/create
router.post('/create', validateRequest(createBookingSchema), async (req, res) => {
  try {
    const { artistId, serviceId, date, duration, message, paymentMethod, walletAddress } = req.body;
    const clientId = req.user.id; // From auth middleware

    // Generate booking ID
    const bookingId = uuidv4();

    // Mock booking creation - in production, this would:
    // 1. Validate artist and service exist
    // 2. Check availability
    // 3. Calculate total cost
    // 4. Create payment intent
    // 5. Save to database
    const booking = {
      id: bookingId,
      artistId,
      clientId,
      serviceId,
      date,
      duration,
      message,
      paymentMethod,
      walletAddress,
      status: 'pending',
      totalCost: {
        macs: '85',
        usd: '170'
      },
      platformFee: {
        macs: '4.25',
        usd: '8.50'
      },
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    // Log booking creation
    logger.info('Booking created:', {
      bookingId,
      artistId,
      clientId,
      serviceId,
      paymentMethod
    });

    res.status(201).json({
      success: true,
      data: booking
    });

  } catch (error) {
    logger.error('Error creating booking:', error);
    res.status(500).json({
      error: 'Failed to create booking',
      message: error.message
    });
  }
});

// GET /api/booking/:bookingId
router.get('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Mock booking data - in production, this would query the database
    const booking = {
      id: bookingId,
      artistId: uuidv4(),
      clientId: userId,
      serviceId: uuidv4(),
      serviceName: 'Digital Art Consultation',
      artistName: 'Clara Vincent',
      artistAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786',
      date: '2024-12-25T10:00:00Z',
      duration: 60,
      message: 'Looking forward to discussing my digital art portfolio and getting guidance on NFT creation.',
      paymentMethod: 'macs',
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96590c4C87',
      status: 'confirmed',
      totalCost: {
        macs: '85',
        usd: '170'
      },
      platformFee: {
        macs: '4.25',
        usd: '8.50'
      },
      paymentStatus: 'completed',
      transactionHash: '0x1234567890abcdef',
      createdAt: '2024-12-21T08:30:00Z',
      confirmedAt: '2024-12-21T09:15:00Z',
      meetingLink: 'https://meet.macs.art/booking/' + bookingId
    };

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    logger.error('Error getting booking:', error);
    res.status(500).json({
      error: 'Failed to get booking',
      message: error.message
    });
  }
});

// PUT /api/booking/:bookingId
router.put('/:bookingId', validateRequest(updateBookingSchema), async (req, res) => {
  try {
    const { bookingId } = req.params;
    const updates = req.body;
    const userId = req.user.id;

    // Mock booking update - in production, this would:
    // 1. Validate user has permission to update
    // 2. Validate status transitions
    // 3. Handle payment refunds if cancelled
    // 4. Send notifications
    // 5. Update database
    const updatedBooking = {
      id: bookingId,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    };

    // Log booking update
    logger.info('Booking updated:', {
      bookingId,
      updates,
      userId
    });

    res.json({
      success: true,
      data: updatedBooking
    });

  } catch (error) {
    logger.error('Error updating booking:', error);
    res.status(500).json({
      error: 'Failed to update booking',
      message: error.message
    });
  }
});

// GET /api/booking/user/bookings
router.get('/user/bookings', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;

    // Mock user bookings - in production, this would query the database
    const bookings = {
      bookings: [
        {
          id: uuidv4(),
          artistId: uuidv4(),
          artistName: 'Clara Vincent',
          artistAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786',
          serviceName: 'Digital Art Consultation',
          date: '2024-12-25T10:00:00Z',
          duration: 60,
          status: 'confirmed',
          totalCost: { macs: '85', usd: '170' },
          createdAt: '2024-12-21T08:30:00Z'
        },
        {
          id: uuidv4(),
          artistId: uuidv4(),
          artistName: 'Kenji Nakamura',
          artistAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
          serviceName: 'Cultural Art Workshop',
          date: '2024-12-28T14:00:00Z',
          duration: 150,
          status: 'pending',
          totalCost: { macs: '150', usd: '300' },
          createdAt: '2024-12-20T16:45:00Z'
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
      data: bookings
    });

  } catch (error) {
    logger.error('Error getting user bookings:', error);
    res.status(500).json({
      error: 'Failed to get bookings',
      message: error.message
    });
  }
});

// POST /api/booking/:bookingId/review
router.post('/:bookingId/review', validateRequest(reviewSchema), async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rating, comment, tags } = req.body;
    const userId = req.user.id;

    // Mock review creation - in production, this would:
    // 1. Validate booking exists and is completed
    // 2. Validate user is the client
    // 3. Check if review already exists
    // 4. Save review to database
    // 5. Update artist rating
    const review = {
      id: uuidv4(),
      bookingId,
      clientId: userId,
      rating,
      comment,
      tags,
      createdAt: new Date().toISOString()
    };

    // Log review creation
    logger.info('Review created:', {
      bookingId,
      rating,
      userId
    });

    res.status(201).json({
      success: true,
      data: review
    });

  } catch (error) {
    logger.error('Error creating review:', error);
    res.status(500).json({
      error: 'Failed to create review',
      message: error.message
    });
  }
});

// GET /api/booking/stats
router.get('/stats', async (req, res) => {
  try {
    // Mock booking statistics - in production, this would aggregate from database
    const stats = {
      totalBookings: 15420,
      completedBookings: 14891,
      totalRevenue: {
        macs: '1250000',
        usd: '2500000'
      },
      averageRating: 4.8,
      topServices: [
        { name: 'Digital Art Consultation', bookings: 3420 },
        { name: 'Custom Artwork Commission', bookings: 2890 },
        { name: 'Cultural Workshop', bookings: 2156 }
      ],
      monthlyBookings: [
        { month: '2024-06', bookings: 1200 },
        { month: '2024-07', bookings: 1350 },
        { month: '2024-08', bookings: 1420 },
        { month: '2024-09', bookings: 1380 },
        { month: '2024-10', bookings: 1520 },
        { month: '2024-11', bookings: 1680 },
        { month: '2024-12', bookings: 1890 }
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
    logger.error('Error getting booking stats:', error);
    res.status(500).json({
      error: 'Failed to get booking stats',
      message: error.message
    });
  }
});

module.exports = router;

