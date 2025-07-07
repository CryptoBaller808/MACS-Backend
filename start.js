const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5176', 'https://vwdqfprm.manus.space'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'MACS Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.get('/api/v1/campaigns', (req, res) => {
  // Sample campaigns data - replace with Prisma queries
  const campaigns = [
    {
      id: "1",
      title: "Traditional Ceramic Art Exhibition",
      description: "Help me create a stunning exhibition showcasing traditional Hawaiian ceramic techniques passed down through generations.",
      targetAmount: 5000,
      currentAmount: 1350,
      progressPercentage: 27.0,
      deadline: "2025-08-15T23:59:59Z",
      daysRemaining: 39,
      status: "active",
      artistId: "1",
      imageUrl: "/images/ceramic-exhibition.jpg",
      contributionsCount: 3,
      createdAt: "2025-07-01T10:00:00Z",
      updatedAt: new Date().toISOString()
    },
    {
      id: "2",
      title: "Community Art Workshop Series",
      description: "Fund a series of free community workshops to teach traditional pottery techniques to local youth.",
      targetAmount: 3000,
      currentAmount: 800,
      progressPercentage: 26.7,
      deadline: "2025-07-30T23:59:59Z",
      daysRemaining: 23,
      status: "active",
      artistId: "1",
      imageUrl: "/images/workshop-series.jpg",
      createdAt: "2025-06-15T14:20:00Z",
      updatedAt: "2025-07-07T12:15:00Z"
    }
  ];

  res.json({
    success: true,
    campaigns,
    total: campaigns.length
  });
});

app.post('/api/v1/campaigns', (req, res) => {
  const { title, description, targetAmount, deadline, artistId, imageUrl } = req.body;
  
  // Validate required fields
  if (!title || !description || !targetAmount || !deadline || !artistId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: title, description, targetAmount, deadline, artistId'
    });
  }

  // Create new campaign - replace with Prisma create
  const newCampaign = {
    id: String(Date.now()),
    title,
    description,
    targetAmount: parseFloat(targetAmount),
    currentAmount: 0,
    deadline,
    artistId,
    imageUrl: imageUrl || "",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Campaign created successfully',
    campaign: newCampaign
  });
});

app.post('/api/v1/contributions', (req, res) => {
  const { campaignId, amount, contributorName, contributorEmail, message, paymentMethod } = req.body;
  
  // Validate required fields
  if (!campaignId || !amount || !contributorName || !contributorEmail) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: campaignId, amount, contributorName, contributorEmail'
    });
  }

  // Create new contribution - replace with Prisma create
  const newContribution = {
    id: String(Date.now()),
    campaignId,
    amount: parseFloat(amount),
    contributorName,
    contributorEmail,
    message: message || "",
    paymentMethod: paymentMethod || "credit_card",
    createdAt: new Date().toISOString()
  };

  // Mock campaign update - replace with Prisma update
  const updatedCampaign = {
    id: campaignId,
    artistId: "1",
    title: "Traditional Ceramic Art Exhibition",
    description: "Help me create a stunning exhibition showcasing traditional Hawaiian ceramic techniques passed down through generations.",
    targetAmount: 5000,
    currentAmount: 1350 + parseFloat(amount),
    progressPercentage: ((1350 + parseFloat(amount)) / 5000) * 100,
    deadline: "2025-08-15T23:59:59Z",
    daysRemaining: 39,
    status: "active",
    imageUrl: "/images/ceramic-exhibition.jpg",
    contributionsCount: 4,
    createdAt: "2025-07-01T10:00:00Z",
    updatedAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Contribution submitted successfully',
    contribution: newContribution,
    campaign: updatedCampaign
  });
});

// Booking endpoints (existing functionality)
app.get('/api/v1/bookings/availability/:artistId', (req, res) => {
  const { artistId } = req.params;
  const { date } = req.query;

  // Mock availability data - replace with Prisma queries
  res.json({
    success: true,
    available: true,
    artistId,
    date,
    availableSlots: ['09:00', '10:00', '14:00', '15:00', '16:00']
  });
});

app.post('/api/v1/bookings', (req, res) => {
  const { artistId, date, time, clientName, clientEmail, reason } = req.body;
  
  if (!artistId || !date || !time || !clientName || !clientEmail) {
    return res.status(400).json({
      success: false,
      message: 'Missing required booking fields'
    });
  }

  const newBooking = {
    id: String(Date.now()),
    artistId,
    date,
    time,
    clientName,
    clientEmail,
    reason: reason || "",
    status: "pending",
    createdAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Booking request submitted successfully',
    booking: newBooking
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌺 MACS Backend API running on port ${PORT}`);
  console.log(`🚀 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

