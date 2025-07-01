# MACS Backend API v1.0

**Muse Art Creative Sphere - Production-Ready Backend**

A comprehensive Node.js/Express API for the MACS platform, providing multichain wallet integration, booking systems, crowdfunding, and blockchain services for global artists and creators.

## 🌟 Features

### 🔗 **Multichain Integration**
- **Polygon Network**: ERC-20 MACS token, MetaMask/Trust Wallet support
- **Solana Network**: SPL token, Phantom/Backpack wallet support
- **Cross-Chain Bridge**: Wormhole-powered transfers between networks
- **Real-time Balance**: Live wallet balance tracking and transaction history

### 💼 **Booking System**
- **Artist Services**: Consultation, commission, workshop booking
- **Calendar Integration**: Availability management and scheduling
- **Payment Processing**: MACS token, stablecoin, and fiat payments
- **Review System**: Client feedback and artist ratings

### 💰 **Crowdfunding Platform**
- **Campaign Management**: Create, fund, and manage artistic projects
- **Tiered Rewards**: NFT rewards, exclusive content, physical goods
- **Smart Contract Escrow**: Automated fund release and refunds
- **Multi-Currency Support**: MACS, USDT, USD payment options

### 🔐 **Authentication & Security**
- **JWT Authentication**: Secure token-based authentication
- **Wallet Login**: Sign-in with Polygon/Solana wallets
- **Role-Based Access**: Artist, user, and admin permissions
- **Rate Limiting**: API protection and abuse prevention

### 📊 **Database Architecture**
- **Prisma ORM**: Type-safe database operations
- **PostgreSQL**: Robust relational database
- **Comprehensive Schema**: Users, artists, bookings, campaigns, transactions
- **Migration Support**: Database versioning and updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis (optional, for caching)
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd macs-backend-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npx prisma migrate dev
npx prisma generate

# Start development server
npm run dev
```

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/macs_db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Blockchain
POLYGON_RPC_URL="https://polygon-rpc.com"
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
WORMHOLE_BRIDGE_ADDRESS="0x..."

# External Services
REDIS_URL="redis://localhost:6379"
EMAIL_SERVICE_API_KEY="your-email-service-key"

# API Configuration
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

## 📚 API Documentation

### Base URL
```
Development: http://localhost:3000/api
Production: https://api.macs.art/api
```

### Authentication
All protected endpoints require a Bearer token:
```bash
Authorization: Bearer <jwt_token>
```

### Core Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - Email/password login
- `POST /auth/wallet-login` - Wallet signature login
- `GET /auth/me` - Get current user profile
- `POST /auth/refresh` - Refresh JWT token

#### Wallet Management
- `GET /wallet/balance/:address` - Get wallet balance
- `POST /wallet/connect` - Connect new wallet
- `GET /wallet/transactions` - Transaction history
- `POST /wallet/tip` - Send tip to artist

#### Bridge Operations
- `POST /bridge/initiate` - Start cross-chain transfer
- `GET /bridge/status/:id` - Check bridge status
- `GET /bridge/history` - Bridge transaction history

#### Booking System
- `GET /booking/services` - List artist services
- `POST /booking/create` - Create new booking
- `GET /booking/calendar/:artistId` - Artist availability
- `PUT /booking/:id/status` - Update booking status

#### Crowdfunding
- `GET /crowdfunding/campaigns` - List campaigns
- `POST /crowdfunding/campaigns` - Create campaign
- `POST /crowdfunding/campaigns/:id/contribute` - Make contribution
- `GET /crowdfunding/stats` - Platform statistics

### Response Format
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Error Format
```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-12-21T10:00:00Z"
}
```

## 🏗️ Architecture

### Project Structure
```
src/
├── app.js              # Express app configuration
├── server.js           # Server entry point
├── config/
│   ├── database.js     # Database configuration
│   ├── redis.js        # Redis configuration
│   └── schema.prisma   # Prisma schema
├── controllers/        # Request handlers
├── services/           # Business logic
│   ├── authService.js
│   ├── blockchainService.js
│   ├── paymentService.js
│   └── notificationService.js
├── routes/             # API routes
│   ├── auth.js
│   ├── wallet.js
│   ├── booking.js
│   ├── crowdfunding.js
│   └── bridge.js
├── middleware/         # Express middleware
│   ├── auth.js
│   ├── validation.js
│   ├── rateLimit.js
│   └── errorHandler.js
├── models/             # Database models
├── utils/              # Utility functions
│   ├── logger.js
│   ├── encryption.js
│   └── validators.js
└── tests/              # Test files
```

### Database Schema
- **Users**: Authentication and profile data
- **ArtistProfiles**: Artist-specific information
- **Services**: Bookable artist services
- **Bookings**: Service bookings and scheduling
- **Campaigns**: Crowdfunding campaigns
- **Contributions**: Campaign contributions
- **Transactions**: Blockchain transactions
- **WalletConnections**: User wallet associations

### Security Features
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Request throttling
- **Input Validation**: Joi schema validation
- **CORS Protection**: Cross-origin request security
- **Helmet**: Security headers
- **SQL Injection Protection**: Prisma ORM safety

## 🐳 Docker Support

### Development
```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### Production
```bash
# Build production image
docker build -t macs-api:latest .

# Run production container
docker run -d \
  --name macs-api \
  -p 3000:3000 \
  --env-file .env.production \
  macs-api:latest
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm run test:auth
npm run test:booking
npm run test:crowdfunding

# Run integration tests
npm run test:integration
```

## 📈 Monitoring & Logging

### Logging
- **Winston**: Structured logging
- **Log Levels**: error, warn, info, debug
- **Log Rotation**: Daily rotation with compression
- **Request Logging**: Morgan middleware

### Health Checks
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system status
- Database connectivity
- Redis connectivity
- External service status

### Metrics
- Request count and response times
- Database query performance
- Blockchain transaction status
- Error rates and types

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Build application
npm run build

# Start production server
npm start

# Start with PM2
npm run start:pm2
```

### Environment Setup
1. **Database**: Set up PostgreSQL instance
2. **Redis**: Configure Redis for caching (optional)
3. **Environment Variables**: Configure all required variables
4. **SSL Certificates**: Set up HTTPS for production
5. **Load Balancer**: Configure for high availability

## 🔧 Configuration

### Database Configuration
```javascript
// config/database.js
module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    ssl: false
  },
  production: {
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  }
};
```

### Blockchain Configuration
```javascript
// config/blockchain.js
module.exports = {
  polygon: {
    rpcUrl: process.env.POLYGON_RPC_URL,
    chainId: 137,
    macsTokenAddress: process.env.POLYGON_MACS_ADDRESS
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL,
    cluster: 'mainnet-beta',
    macsTokenMint: process.env.SOLANA_MACS_MINT
  }
};
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use conventional commit messages

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: [docs.macs.art](https://docs.macs.art)
- **API Reference**: [api.macs.art/docs](https://api.macs.art/docs)
- **Discord**: [discord.gg/macs](https://discord.gg/macs)
- **Email**: support@macs.art

## 🎯 Roadmap

### v1.1 (Q1 2025)
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Enhanced security features

### v1.2 (Q2 2025)
- [ ] AI-powered recommendations
- [ ] Advanced booking features
- [ ] Mobile app API support
- [ ] Performance optimizations

### v2.0 (Q3 2025)
- [ ] Additional blockchain networks
- [ ] Advanced DeFi integrations
- [ ] Enterprise features
- [ ] White-label solutions

---

**Built with ❤️ for the global creative community**

*Empowering artists worldwide through blockchain technology*

