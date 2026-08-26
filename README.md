# MAAPG - Accommodation Platform

A unified accommodation discovery + booking platform for Hotels, Hostels, PG, Rooms, and Rentals.

## Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Cache:** Redis
- **Storage:** Cloudinary
- **Payments:** Razorpay

## Project Structure

```
MAAPG/
├── server/           # Backend API
│   ├── src/
│   │   ├── config/   # Database, Redis, Cloudinary config
│   │   ├── middleware/ # Auth, RBAC, Error handling
│   │   ├── modules/  # Feature modules (auth, users, dealers, etc.)
│   │   ├── prisma/   # Database schema and seeds
│   │   └── utils/    # Helpers, logger, API response
│   └── package.json
├── client/           # Frontend React app
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/    # Page components
│   │   ├── services/ # API client functions
│   │   ├── store/    # Zustand state management
│   │   └── utils/    # Helpers and utilities
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### 1. Start Database

```bash
docker-compose up -d
```

### 2. Setup Server

```bash
cd server
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

### 3. Setup Client

```bash
cd client
npm install
npm run dev
```

### 4. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@maapg.com | Admin@123 |
| Dealer | dealer@maapg.com | Dealer@123 |
| Customer | customer@maapg.com | Customer@123 |

## Features

### Super Admin Dashboard
- **Dashboard:** KPIs, revenue charts, recent activity
- **Users:** User management with block/unblock
- **Dealers:** Dealer verification workflow (Pending → Approved/Rejected)
- **Properties:** Property management with approval flow
- **Bookings:** Booking management and status updates
- **Payments:** Payment tracking and refund processing
- **Revenue:** Revenue analytics by property type
- **Complaints:** Support ticket management
- **Reviews:** Review moderation
- **Enquiries:** Enquiry tracking and conversion
- **Offers:** Coupon and promotion management
- **Settings:** Platform settings and commission rates
- **Audit Logs:** System activity tracking
- **Notifications:** In-app notification system

### Dealer Features
- Register and await verification
- Add and manage properties
- Manage rooms and availability
- Handle bookings and enquiries
- View earnings and analytics

### Customer Features
- Search and filter properties
- View property details
- Make bookings
- Send enquiries
- Leave reviews
- Manage wishlist

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh-token` - Refresh token
- `GET /api/auth/me` - Get current user

### Users (Admin)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id/status` - Block/Unblock user

### Dealers (Admin)
- `GET /api/dealers` - List all dealers
- `GET /api/dealers/pending` - Get pending dealers
- `GET /api/dealers/:id` - Get dealer details
- `PUT /api/dealers/:id/approve` - Approve dealer
- `PUT /api/dealers/:id/reject` - Reject dealer

### Properties (Admin)
- `GET /api/properties` - List all properties
- `GET /api/properties/pending` - Get pending properties
- `GET /api/properties/:id` - Get property details
- `PUT /api/properties/:id/approve` - Approve property
- `PUT /api/properties/:id/reject` - Reject property

### Bookings
- `GET /api/bookings` - List all bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/status` - Update booking status

### Payments
- `GET /api/payments` - List all payments
- `GET /api/payments/analytics/overview` - Payment analytics
- `PUT /api/payments/:id/refund` - Process refund

### Analytics
- `GET /api/analytics/dashboard` - Dashboard overview
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/properties/by-type` - Property analytics

## Database Schema

Key tables:
- `User` - All users (Admin, Dealer, Customer)
- `Dealer` - Dealer profiles with verification status
- `Property` - Properties with type and status
- `Room` - Rooms within properties
- `Booking` - Customer bookings
- `Payment` - Payment records
- `Review` - Property reviews
- `Enquiry` - Customer enquiries
- `Complaint` - Support tickets
- `Notification` - In-app notifications
- `AuditLog` - System audit trail

## License

Private - All rights reserved.
