# Odoo Cafe POS

MERN stack Point of Sale system for restaurant/cafe operations.

**GitHub:** https://github.com/Saad2607/odoo-cafe-pos

## Stack

| Layer | Technology |
|-------|------------|
| **M** | MongoDB Atlas + Mongoose |
| **E** | Express.js + Node.js |
| **R** | React + Vite + TypeScript |
| **N** | Node.js runtime |

## Features

### Phase 1 — Auth & Session
- Signup / Login (JWT)
- Role-based access (ADMIN / EMPLOYEE)
- Auto-open POS session on login

### Phase 2 — Operations
- Floor plan with table status (FREE / OCCUPIED)
- Order taking with product menu
- Kitchen display with live queue
- MongoDB Atlas persistence

### Phase 3 — Business
- Admin product management (CRUD)
- Coupon codes at checkout (`WELCOME10` = 10% off)
- Session close with sales summary
- Live dashboard stats

## Quick Start

### 1. Clone
```bash
git clone https://github.com/Saad2607/odoo-cafe-pos.git
cd odoo-cafe-pos
```

### 2. Backend
```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URL and secrets
npm install
npm run dev
```

### 3. Frontend
```bash
cd client
npm install
npm run dev
```

- API: http://localhost:3001
- App: http://localhost:5173

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cafe.com | admin123 |
| Cashier | cashier@cafe.com | cashier123 |

## Demo Coupon

| Code | Discount |
|------|----------|
| WELCOME10 | 10% off order total |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/floors` | Floor plan |
| GET | `/api/products` | Menu products |
| POST | `/api/orders` | Create order |
| PATCH | `/api/orders/:id/pay` | Pay order |
| GET | `/api/kitchen` | Kitchen queue |
| POST | `/api/coupons/validate` | Validate coupon |
| POST | `/api/session/close` | Close shift |

## Project Structure

```
odoo-cafe-pos/
├── client/          # React frontend
│   └── src/
│       ├── pages/   # Login, Floor, Order, Kitchen, Admin
│       └── lib/     # API client
└── server/          # Express backend
    └── src/
        ├── models/  # Mongoose schemas
        ├── routes/  # API routes
        └── services/
```

## MongoDB Compass

Connect to your Atlas cluster → database **`odoo-cafe`** → collections: `users`, `products`, `orders`, etc.

## License

Hackathon project — Odoo Cafe POS
