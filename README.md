# Expense Server – Backend API

REST API backend for the expense management application. Built with Node.js and Express, it handles authentication, groups, expenses, settlements, dashboard analytics, and payments.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Authentication & Authorization](#authentication--authorization)
- [Data Models](#data-models)
- [Scripts](#scripts)

---

## Overview

Expense Server is the backend for the expense-client frontend. It provides:

- **Authentication**: Email/password and Google SSO, JWT in HTTP-only cookies, password reset via OTP
- **Groups**: Create, update, delete groups; add members; per-group balances
- **Expenses**: CRUD expenses with splits (equal/unequal), categories, and balance updates
- **Settlements**: Record payments between members; expense-specific or group-level
- **Dashboard**: Summary stats, category breakdown, quick-settle debts
- **RBAC**: Role-based access (viewer, manager, admin) for users and groups
- **Payments**: Razorpay orders and subscriptions (and webhooks)
- **Profile**: User info for profile/payments UI

---

## Features

### Authentication
- Register (email/password, default role admin)
- Login / logout (JWT in `jwt` cookie)
- Google SSO (`/auth/google-auth`)
- Check if user has password (`/auth/valid-login`)
- Password reset: generate code, verify code, reset password
- Get current user (`/auth/get-user`)

### Groups
- Create, update, delete groups (permission-based)
- List current user’s groups with pagination and sort
- Add members by email
- Per-group: total owed by user, total owed to user, “people I owe”
- Group audit logs

### Expenses
- Create expense (paidBy, splits, category, splitType)
- List expenses by group
- Update / delete expense
- Get expenses by category (for dashboard)

### Settlements
- Create settlement (group or expense-linked)
- List settlements by group
- List settlements by expense
- List all settlements for current user (`/settlements/user/`)

### Dashboard
- Summary: totalBalance, totalOwe, totalOwed, monthlyTotal
- Spending grouped by category
- Quick-settle: aggregated debts (who you owe, per group)

### Users (RBAC)
- List users (admin/manager/viewer by permission)
- Create user (admin only in current permissions)
- Update user
- Delete user (admin only)

### Payments & Profile
- Razorpay: create order, verify order, create/capture subscription
- Webhook for payment events (raw body)
- Get user info for profile/payments

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express 5.x
- **Database**: MongoDB (Mongoose 8.x)
- **Auth**: JWT (jsonwebtoken), bcrypt, Google Auth (google-auth-library)
- **Validation**: express-validator
- **Payments**: Razorpay
- **Email**: Nodemailer (OTP / reset)
- **Other**: dotenv, cors, cookie-parser
- **Dev**: nodemon

---

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB instance
- (Optional) Razorpay and Google OAuth credentials for payments and SSO

### Installation

1. Clone and install:

   ```bash
   git clone <repository-url>
   cd expense-server
   npm install
   ```

2. Create `.env` in the project root (see [Environment Variables](#environment-variables)).

3. Start the server:

   ```bash
   npm run dev
   ```

   By default the server runs at `http://localhost:5001`. The frontend should use this as `VITE_SERVER_ENDPOINT` (and CORS must allow the client origin).

---

## Environment Variables

Create a `.env` file in the root:

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_DB_CONNECTION_URL` | MongoDB connection string | Yes |
| `CLIENT_URL` | Frontend origin for CORS (e.g. `http://localhost:5173`) | Yes |
| `JWT_SECRET` | Secret used to sign/verify JWT | Yes |
| `NODE_ENV` | `production` or development | Optional |
| (Razorpay) | Razorpay key/secret/webhook secret as used in `paymentsController` | For payments |
| (Email) | SMTP or mail config used in `emailService` | For OTP / reset |

Example:

```env
MONGO_DB_CONNECTION_URL=mongodb://localhost:27017/expense
CLIENT_URL=http://localhost:5173
JWT_SECRET=your-secret
NODE_ENV=development
```

---

## API Overview

Base URL: `http://localhost:5001` (or your deployed URL).

### Route Mounting

- `/auth` – auth routes
- `/groups` – group CRUD, balance endpoints, nested expenses and settlements
- `/user` – RBAC user CRUD
- `/payments` – orders, subscriptions, webhook
- `/profile` – user info
- `/dashboard` – summary, category breakdown, quick-settle
- `/groups/:groupId/settlements` – group settlements
- `/settlements` – e.g. `/settlements/user/` for current user’s settlements

### Auth (no JWT required for these)

- `POST /auth/register` – register
- `POST /auth/login` – login (sets `jwt` cookie)
- `GET /auth/logout` – logout (clear cookie)
- `POST /auth/google-auth` – Google SSO
- `POST /auth/valid-login` – check if user has password
- `POST /auth/generate-code` – send reset code
- `POST /auth/verify-code` – verify code
- `POST /auth/reset-password` – reset password

### Auth (JWT required)

- `GET /auth/get-user` – current user

### Groups (JWT + permission)

- `POST /groups/create` – create group (`group:create`)
- `PATCH /groups/:groupId` – update (`group:update`)
- `PATCH /groups/:groupId/add-members` – add members (`group:update`)
- `GET /groups/my-groups` – list my groups (`group:view`), supports pagination/sort
- `GET /groups/:groupId/logs` – audit logs (`group:view`)
- `DELETE /groups/:groupId/delete` – delete group (`group:delete`)
- `GET /groups/:groupId/total-owed` – total I owe in group
- `GET /groups/:groupId/total-is-owed` – total I am owed in group
- `GET /groups/:groupId/people-i-owe` – creditors in group

### Expenses (under group, JWT required)

- `POST /groups/:groupId/expenses` – create expense
- `GET /groups/:groupId/expenses` – list by group
- `PATCH /groups/:groupId/expenses/:expenseId` – update
- `DELETE /groups/:groupId/expenses/:expenseId` – delete
- `GET /groups/:groupId/expenses/category/` – by category (dashboard)

### Settlements

- `POST /groups/:groupId/settlements` – create settlement in group
- `GET /groups/:groupId/settlements` – list by group
- `GET /groups/:groupId/settlements/expense/:expenseId` – by expense
- `GET /settlements/user/` – all settlements for current user

### Dashboard (JWT required)

- `GET /dashboard/summary` – totalBalance, totalOwe, totalOwed, monthlyTotal
- `GET /dashboard/grouped-by-category` – spending by category
- `GET /dashboard/quick-settle` – debts (who you owe, per group)

### User (RBAC, JWT + permission)

- `GET /user/` – list users (`user:view`)
- `POST /user/` – create user (`user:create`)
- `PATCH /user/` – update user (`user:update`)
- `DELETE /user/delete` – delete user (`user:delete`)

### Profile & Payments (JWT required)

- `GET /profile/get-user-info` – user info
- `POST /payments/create-order` – create Razorpay order (`payment:create`)
- `POST /payments/verify-order` – verify order
- `POST /payments/create-subscription` – create subscription
- `POST /payments/capture-subscription` – capture subscription
- `POST /payments/webhook` – Razorpay webhook (raw body; no `express.json()`)

All authenticated requests must send the JWT in the cookie (same-origin or CORS with `credentials: true`).

---

## Authentication & Authorization

### Authentication

- **JWT**: Issued on login/register/Google auth, stored in HTTP-only cookie `jwt`.
- **Middleware**: `authMiddleware.protect` reads `req.cookies.jwt`, verifies with `JWT_SECRET`, sets `req.user` (e.g. `id`, `email`, `username`, `role`).
- **Logout**: Clear `jwt` cookie; client should clear cookies as well.

### Authorization (RBAC)

- **Roles**: `admin`, `manager`, `viewer` (see `src/utility/userRoles.js`).
- **Permissions**: Defined in `src/utility/permissions.js` and checked by `authorizeMiddleware(requiredPermission)`.

Current mapping:

- **admin**: `user:create`, `user:update`, `user:delete`, `user:view`, `group:create`, `group:update`, `group:delete`, `group:view`, `payment:create`.
- **manager**: `user:view`, `group:create`, `group:update`, `group:view`.
- **viewer**: `user:view`, `group:view`.

Routes that need a permission use both `authMiddleware.protect` and `authorizeMiddleware('permission:action')`.

---

## Data Models

### User
- username, email, password (optional if Google), googleId, role
- code, codeExpiresAt (reset flow)
- adminId (optional), credits, subscription (Razorpay subscription schema)

### Group
- name, description, adminEmail, createdBy (ref User), memberEmail[], thumbnail
- paymentStatus, balances[] (userEmail, netBalance)

### Expense
- groupId (ref Group), category, title, notes, currency, amount
- paidBy[] (userId, email, amount), splits[] (userId, email, share, remaining), splitType (equal, unequal, share, custom)
- timestamps

### Settlement
- groupId, type (expense-settlement | group-settlement), fromUserEmail, toUserEmail, amount, currency, expenseId (optional), note
- timestamps

---

## Scripts

- `npm start` – run server: `node server.js`
- `npm run dev` – run with nodemon
- `npm test` – placeholder (no tests yet)

---

## Notes

- **CORS**: Configured with `origin: process.env.CLIENT_URL` and `credentials: true` so the client can send cookies.
- **Webhook**: `/payments/webhook` uses `express.raw({ type: 'application/json' })`; the rest of the app uses `express.json()`. The conditional in `server.js` skips JSON body parsing for that path.
- **Port**: Default is `5001` in `server.js`; change there or via env if needed.
- **Dashboard route**: `dashboardRoutes` is required as `./src/routes/dashboardRoutes` so the server can be run from the `expense-server` directory.

---

Built to work with the **expense-client** frontend.