# Brivio Cafe POS

Full-stack **Point of Sale** system for cafe and restaurant operations — built with the **MERN** stack for the Odoo Hackathon.

**Repository:** https://github.com/Saad2607/odoo-cafe-pos

---

## Overview

**Brivio Cafe POS** digitizes the complete cafe workflow: table management, ordering across a **500+ item mega menu**, kitchen coordination, payments, admin control, and live business analytics.

| Role | Responsibility |
|------|----------------|
| **Admin** | Dashboard, menu, floors, users, discounts, settings, reports, live ops |
| **Cashier** | Floor plan, orders, payments, kitchen board, **end-of-shift session close** |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **M** | MongoDB Atlas + Mongoose |
| **E** | Express.js 5 + Node.js |
| **R** | React 19 + Vite + TypeScript |
| **N** | Node.js runtime |
| **Auth** | JWT + bcrypt |
| **Email** | Nodemailer (optional receipt emails) |

---

## Key Features

### Authentication & Roles
- Sign up (creates Admin) / Login with JWT
- Role-based access: `ADMIN` and `EMPLOYEE` (Cashier)
- Auto-open POS session on login
- Custom in-app confirm/alert dialogs (no browser popups)

### Cashier Operations
- **Floor Plan** — table grid with FREE / OCCUPIED status
- **Order Taking** — full menu, search, combos, smart pairings
- **Kitchen Display (KDS)** — live queue, tap-to-advance stages
- **Payments** — Cash, Card, UPI + coupons & promotions
- **End Shift** — cashier closes session with sales summary
- Sign-out warning if session is still open

### Admin Operations
- **Dashboard** — today's store-wide metrics & charts
- **Menu Admin** — paginated CRUD on 500+ products
- **Menu Explorer** — browse catalog with filters & Surprise Me
- **Floor Plan Admin** — floors & tables setup
- **Users** — assign cashiers and admins
- **Settings** — categories, colors, payment methods, UPI ID
- **Discounts** — coupons & promotions
- **Customers** — search & manage profiles
- **Bookings** — table reservations
- **Reports** — sales analytics, CSV / PDF export
- **Live Ops** — real-time command center

### Unique Differentiators
- **~578 products** across **18 categories** (auto-seeded mega menu)
- **Combo Meals** — bundled deals with savings
- **Menu Explorer** — public-style catalog browser
- **Per-product images** — unique image URL per item
- **Live Ops** — real-time floor, kitchen & sales view
- **Terracotta cafe UI** — unified design system across all pages

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas URI (or local MongoDB)

### 1. Clone

```bash
git clone https://github.com/Saad2607/odoo-cafe-pos.git
cd odoo-cafe-pos
```

### 2. Backend

```bash
cd server
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, etc.
npm install
npm run dev
```

Server runs at **http://localhost:3001** and auto-seeds demo data when products &lt; 500.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

App runs at **http://localhost:5173**

### Optional scripts

```bash
cd server
npm run db:seed      # Re-run full seed
npm run db:images    # Refresh product images only
```

---

## Environment Variables

Copy `server/.env.example` to `server/.env`:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing tokens |
| `PORT` | API port (default `3001`) |
| `CLIENT_URL` | Frontend URL for receipt links |
| `SMTP_USER` / `SMTP_PASS` | Optional — email receipts via Gmail |
| `SEED_*` | Demo admin & cashier credentials |

---

## Demo Accounts

| Role | Email | Password | Lands on |
|------|-------|----------|----------|
| Admin | admin@cafe.com | admin123 | `/dashboard` |
| Cashier | cashier@cafe.com | cashier123 | `/floor` |

### Demo offers

Cashiers and customers see active offers on the **Floor Plan** and in the **order cart** (Today's Offers panel). Coupons can be applied with one tap from the cart or via **Discount / Coupon** at checkout.

| Type | Name / Code | Savings | How it applies |
|------|-------------|---------|----------------|
| Coupon | `WELCOME10` | 10% off order total | Enter code at checkout — cashier applies from Discount / Coupon |
| Auto promo | Big Order Discount | ₹50 off | Spend ₹700+ — applied automatically, no code needed |

---

## User Workflow

```
Admin signs up → Adds cashiers in Users → Configures menu & floors
        ↓
Cashier logs in → Floor Plan → Table → Order → Kitchen → Pay
        ↓
Cashier ends shift (Close Session) → Sales summary → Logout
        ↓
Admin views Dashboard / Reports / Live Ops
```

**Note:** Revenue on the dashboard counts **paid** orders only. Draft orders appear in totals but not in revenue until payment.

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/signup` | Register admin |
| POST | `/api/auth/login` | Login |
| GET | `/api/session/current` | Session stats |
| POST | `/api/session/close` | Close cashier shift |
| GET | `/api/floors` | Floor plan |
| GET | `/api/products` | Menu (filtered) |
| GET | `/api/products/all` | Paginated catalog (admin) |
| GET | `/api/products/stats` | Catalog statistics |
| GET | `/api/combos` | Combo meal bundles |
| POST | `/api/orders` | Create order |
| PATCH | `/api/orders/:id/pay` | Pay order |
| GET | `/api/orders/session` | Session orders |
| GET | `/api/kitchen` | Kitchen queue |
| GET | `/api/live` | Live ops data |
| GET | `/api/reports` | Sales reports (admin) |
| GET | `/api/customers` | Customers |
| POST | `/api/coupons/validate` | Validate coupon |
| GET | `/api/discounts/offers` | Active coupons & promotions (cashier) |
| CRUD | `/api/users` | User management (admin) |

---

## Project Structure

```
odoo-cafe-pos/
├── client/                    # React + Vite frontend
│   └── src/
│       ├── pages/             # Login, Dashboard, Floor, Order, Kitchen, Admin…
│       ├── components/        # AppLayout, modals, session card…
│       ├── context/           # Dialog provider
│       ├── hooks/             # Close session, session open
│       ├── lib/               # API client, food images
│       └── styles/            # Theme, UI refresh, page CSS
└── server/                    # Express API
    └── src/
        ├── models/            # Mongoose schemas
        ├── routes/            # REST endpoints
        ├── services/          # Orders, coupons, receipts, sessions
        └── seed/              # Mega menu catalog, images, seed script
```

---

## Pages & Routes

| Path | Access | Description |
|------|--------|-------------|
| `/login` | Public | Sign in |
| `/signup` | Public | Create admin account |
| `/dashboard` | Auth | Admin command center |
| `/floor` | Auth | Cashier table view |
| `/order/:tableId` | Auth | Take order |
| `/orders` | Auth | Session orders |
| `/kitchen` | Auth | Kitchen display |
| `/kds` | Auth | Standalone KDS |
| `/menu-explorer` | Auth | Browse 500+ items |
| `/customers` | Auth | Customer management |
| `/bookings` | Auth | Reservations |
| `/live-ops` | Auth | Real-time ops |
| `/reports` | Admin | Analytics |
| `/admin/products` | Admin | Menu admin |
| `/admin/floors` | Admin | Floor setup |
| `/admin/users` | Admin | Team management |
| `/admin/settings` | Admin | Categories & payments |
| `/admin/discounts` | Admin | Coupons & promos |
| `/receipt/:token` | Public | Digital receipt |

---

## MongoDB

Connect via Compass or Atlas → database **`odoo-cafe`**

Main collections: `users`, `products`, `productcategories`, `orders`, `possessions`, `floors`, `restauranttables`, `customers`, `coupons`, `bookings`, `combomeals`, `promotions`

---

## License

Hackathon project — **Brivio Cafe POS** (Odoo Hackathon)
