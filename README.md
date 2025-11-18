# Stock Brokerage Platform

A fully functional, production-ready stock brokerage platform with real-time trading, KYC verification, wallet management, and comprehensive admin controls.

## Features

- **User Management**: Registration, login, email verification, 2FA
- **KYC System**: Document upload and verification workflow
- **Wallet**: Deposits, withdrawals, transaction history
- **Stock Trading**: Real-time prices, buy/sell orders, portfolio management
- **Admin Dashboard**: User management, stock controls, KYC approvals, audit logs
- **Real-time Updates**: WebSocket-based price updates
- **Security**: JWT auth, rate limiting, encryption, audit logs

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TailwindCSS
- React Query
- Zustand
- Recharts
- Socket.IO Client

### Backend
- NestJS
- PostgreSQL
- Redis
- Socket.IO
- BullMQ
- TypeORM

### Infrastructure
- Docker & Docker Compose
- GitHub Actions CI/CD

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Stock-Broker
```

2. Create environment file:
```bash
cp .env.template .env
# Edit .env with your configurations
```

3. Start with Docker:
```bash
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs

### Local Development

#### Backend
```bash
cd backend
npm install
npm run start:dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
Stock-Broker/
├── backend/                # NestJS backend
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── users/         # User management
│   │   ├── kyc/           # KYC verification
│   │   ├── wallet/        # Wallet & transactions
│   │   ├── stocks/        # Stock management
│   │   ├── orders/        # Order processing
│   │   ├── trades/        # Trade execution
│   │   ├── portfolio/     # Portfolio management
│   │   ├── admin/         # Admin operations
│   │   ├── market/        # Market data service
│   │   ├── websocket/     # WebSocket gateway
│   │   └── workers/       # Background jobs
│   ├── migrations/        # Database migrations
│   └── Dockerfile
├── frontend/              # Next.js frontend
│   ├── src/
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Utilities
│   │   └── store/        # State management
│   └── Dockerfile
├── docker-compose.yml
├── .env.template
└── README.md
```

## API Documentation

Once the backend is running, access the interactive API documentation at:
- Swagger UI: http://localhost:3001/api/docs

## Default Credentials

### Super Admin
- Email: admin@stockbroker.com
- Password: (set in .env)

## Security Features

- JWT-based authentication with refresh tokens
- Two-factor authentication (TOTP/SMS)
- Password encryption with bcrypt
- Data encryption at rest
- Rate limiting
- IP tracking
- Audit logging
- CORS protection
- Helmet security headers

## Testing

### Backend
```bash
cd backend
npm run test
npm run test:e2e
```

### Frontend
```bash
cd frontend
npm run test
```

## Deployment

### Production Build

1. Update environment variables for production
2. Build and deploy:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD

GitHub Actions workflows are configured for:
- Automated testing
- Docker image building
- Deployment to staging/production

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
