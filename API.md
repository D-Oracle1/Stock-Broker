# API Documentation

## Base URL

```
Development: http://localhost:3001/api
Production: https://api.your-domain.com/api
```

## Authentication

Most endpoints require authentication using JWT tokens.

### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "password": "SecurePass123!",
  "phone": "+1234567890",
  "dob": "1990-01-01"
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

#### POST /auth/login
Login to user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "twofa_token": "123456"
}
```

**Response:**
```json
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "kyc_status": "not_started"
  }
}
```

#### POST /auth/refresh
Refresh access token.

**Request:**
```json
{
  "refresh_token": "refresh_token"
}
```

**Response:**
```json
{
  "access_token": "new_jwt_token",
  "refresh_token": "new_refresh_token"
}
```

### Users

#### GET /users/me
Get current user profile.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "kyc_status": "approved",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### KYC

#### POST /users/kyc
Submit KYC documents.

**Request:** multipart/form-data
- front_id: file
- back_id: file
- selfie: file
- proof_of_address: file

**Response:**
```json
{
  "message": "KYC documents submitted successfully",
  "kyc": {
    "id": "uuid",
    "status": "pending"
  }
}
```

### Wallet

#### GET /wallet
Get wallet balance.

**Response:**
```json
{
  "id": "uuid",
  "balance": 10000.00,
  "locked_balance": 500.00,
  "currency": "USD"
}
```

#### POST /wallet/deposit/create
Create deposit request.

**Request:**
```json
{
  "amount": 1000,
  "payment_method": "paystack"
}
```

**Response:**
```json
{
  "deposit": {
    "id": "uuid",
    "amount": 1000,
    "status": "pending",
    "reference": "DEP-xxxxx"
  },
  "payment_url": "https://payment-gateway.com/pay?ref=..."
}
```

#### GET /wallet/transactions
Get transaction history.

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "deposit",
      "amount": 1000,
      "status": "completed",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 10
}
```

### Stocks

#### GET /stocks
Get all stocks.

**Query Parameters:**
- category: string (optional)
- search: string (optional)

**Response:**
```json
[
  {
    "id": "uuid",
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "current_price": 178.50,
    "change_percent": 2.5,
    "volume": 52000000
  }
]
```

#### GET /stocks/:symbol
Get stock details.

**Response:**
```json
{
  "id": "uuid",
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "current_price": 178.50,
  "opening_price": 177.00,
  "high_price": 180.00,
  "low_price": 176.50,
  "volume": 52000000
}
```

#### GET /stocks/:symbol/history
Get stock price history.

**Query Parameters:**
- period: 1D, 1W, 1M, 3M, 1Y

**Response:**
```json
{
  "stock": { ... },
  "prices": [
    {
      "price": 178.50,
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Orders

#### POST /orders
Create new order.

**Request:**
```json
{
  "stock_symbol": "AAPL",
  "type": "market",
  "side": "buy",
  "quantity": 10,
  "price": 178.50
}
```

**Response:**
```json
{
  "id": "uuid",
  "stock_symbol": "AAPL",
  "side": "buy",
  "quantity": 10,
  "status": "pending",
  "total_amount": 1785.00
}
```

#### GET /orders
Get user orders.

**Response:**
```json
[
  {
    "id": "uuid",
    "stock": {
      "symbol": "AAPL",
      "name": "Apple Inc."
    },
    "side": "buy",
    "quantity": 10,
    "status": "filled",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Portfolio

#### GET /users/portfolio
Get user portfolio.

**Response:**
```json
{
  "holdings": [
    {
      "stock_symbol": "AAPL",
      "quantity": 10,
      "average_buy_price": 175.00,
      "current_value": 1785.00,
      "unrealized_pnl": 35.00,
      "unrealized_pnl_percent": 2.0
    }
  ],
  "summary": {
    "total_invested": 1750.00,
    "total_current_value": 1785.00,
    "total_unrealized_pnl": 35.00
  }
}
```

### Admin

#### POST /admin/login
Admin login.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "AdminPass123!"
}
```

#### GET /admin/users
Get all users (admin).

**Query Parameters:**
- page: number
- limit: number

**Response:**
```json
{
  "users": [ ... ],
  "total": 100,
  "page": 1,
  "pages": 10
}
```

## WebSocket Events

### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3001');
```

### Subscribe to Stock Updates

```javascript
socket.emit('subscribe', { symbol: 'AAPL' });

socket.on('price:update', (data) => {
  console.log(data);
  // { symbol: 'AAPL', price: 178.50, change: 2.5, ... }
});
```

### Market Updates

```javascript
socket.on('market:update', (updates) => {
  console.log(updates);
  // Array of all stock updates
});
```

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Rate Limiting

- 100 requests per minute per IP
- Exceeded requests return 429 status

## Interactive Documentation

Visit http://localhost:3001/api/docs for Swagger UI with interactive API testing.
