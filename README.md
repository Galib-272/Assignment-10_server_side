<div align="center">

# 📡 TicketBari API Server

### *Core Backend Engine for the Online Ticket Booking Platform*

[![Live API](https://img.shields.io/badge/🚀_Live_API-Deployed-00C7B7?style=for-the-badge&logo=vercel&logoColor=white)](https://ticketbari-server-side.vercel.app)
[![Frontend Repo](https://img.shields.io/badge/💻_Frontend_Repo-View_on_GitHub-181717?style=for-the-badge&logo=github)](https://github.com/Galib-272/Assignment-10_client_side.git)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white)

---

### ⚙️ Secure RESTful API Layer

> *Data persistence · Database operations · Cryptographic session verification · Payment processing · Social identity handshakes*

</div>

---

## ⚡ Backend Architecture Highlights

| Feature | Description |
|---------|-------------|
| 🔐 **Custom JWT Middleware** | Restricts private operations using high-security JSON Web Token extraction with role verification (User / Vendor / Admin). |
| 🌐 **CORS Security** | Strict domain whitelisting — only approved frontend production domains can connect. |
| 💳 **Payment Pipeline** | Instant-pay simulation endpoint that marks bookings as `paid` and logs transaction records with user, vendor, and ticket metadata. |
| ⚡ **Regex Query Aggregations** | Case-insensitive `$regex` matching for lightning-fast ticket searches, transport type filters, and price-sorted result pipelines. |
| 🔄 **Safe Mutation Operations** | Ownership verification before any update or delete — protecting platform data from malicious requests. |
| 👥 **Multi-Role Authorization** | Three-tier role system (User, Vendor, Admin) enforced at middleware level on all sensitive routes. |
| 🚫 **Fraud Vendor System** | `isFraud` field on User model. Admin PATCH route instantly hides all vendor tickets and blocks further ticket creation/editing. |
| ✅ **Booking Status Transitions** | Bookings move through `pending → accepted/rejected → paid` states with seat quantity management on each transition. |

---

## 🆕 Latest Updates (October 2026)

### 🚫 Mark as Fraud — User Model & Admin Route
- Added `isFraud: Boolean` (default `false`) field to the **User** schema
- New route: `PATCH /api/admin/users/:id/fraud`
  - Sets `isFraud` on the vendor
  - When marking as fraud: all their tickets are set to `verificationStatus: "rejected"` and `isAdvertised: false` via `Ticket.updateMany`
  - When removing fraud: flag cleared, tickets remain hidden until admin manually re-approves
- Fraud vendors are blocked at the ticket route level:
  - `POST /api/tickets` — 403 if `isFraud === true`
  - `PATCH /api/tickets/:id` — 403 if `isFraud === true` (admins exempt)

### ✅ GET /auth/me — Returns isFraud
- `/api/auth/me` now returns a flat user object including `isFraud: Boolean`
- Used by the client to immediately show the "Account Suspended" screen on the add-ticket page

### 🔔 Booking Route Order Fix
- Fixed critical Express route ordering: `GET /vendor` now precedes `GET /:id` in booking routes
- Prevents Express from capturing the literal string "vendor" as a MongoDB ObjectId, eliminating CastErrors

### 💳 Instant Pay Endpoint
- `POST /api/payments/pay-instant` — marks a booking as `paid`, creates a Payment record, no real Stripe charge
- Supports the white-label Stripe simulation on the client

### 📦 Booking Status Transitions
- `PATCH /api/bookings/:id/status` handles full lifecycle:
  - `pending → accepted`: no seat change
  - `pending → rejected`: restores seat quantity
  - `accepted → paid`: finalizes booking
  - `accepted → rejected`: restores seat quantity

---

## 🏗️ Core Technology Toolkit

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB (Mongoose ODM + native aggregation) |
| **Auth Protocol** | JSON Web Tokens (jsonwebtoken) |
| **Payment Gateway** | Stripe SDK (simulation mode) |
| **Social Auth** | Google OAuth |
| **Deployment** | Vercel Serverless Functions |

---

## 📋 API Endpoint Reference

### 🔓 Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check — API status heartbeat |
| `GET` | `/api/tickets` | Full ticket directory (search, filter, sort, pagination) |
| `GET` | `/api/tickets/latest` | Latest 6 approved tickets for homepage |
| `GET` | `/api/tickets/advertised` | Up to 6 advertised approved tickets |
| `GET` | `/api/tickets/:id` | Full ticket details |
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/login` | Email + password login |
| `POST` | `/api/auth/google` | Google OAuth sync |

### 🔒 Ticket Endpoints (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tickets/my` | Vendor's own tickets |
| `POST` | `/api/tickets` | Create ticket (vendor, blocked if fraud) |
| `PATCH` | `/api/tickets/:id` | Update ticket (vendor owner or admin, blocked if fraud) |
| `DELETE` | `/api/tickets/:id` | Delete ticket (vendor owner or admin) |
| `PATCH` | `/api/tickets/advertise/:id` | Toggle advertisement status |

### 📦 Booking Endpoints (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/bookings` | Create a booking |
| `GET` | `/api/bookings/my` | Authenticated user's bookings |
| `GET` | `/api/bookings/vendor` | Vendor's received bookings |
| `GET` | `/api/bookings/:id` | Single booking details |
| `PATCH` | `/api/bookings/:id/status` | Update booking status (vendor accept/reject, user pay) |

### 💳 Payment Endpoints (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/pay-instant` | Simulate payment — marks booking as `paid` |
| `GET` | `/api/payments/transactions/user` | User's transaction history |
| `GET` | `/api/payments/transactions/vendor` | Vendor's revenue transactions |
| `GET` | `/api/payments/transactions` | Admin — all platform transactions |

### 👑 Admin Endpoints (Admin JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | All registered platform users |
| `PATCH` | `/api/admin/users/:id/role` | Update user role (user / vendor / admin) |
| `PATCH` | `/api/admin/users/:id/fraud` | **Toggle vendor fraud status** |
| `GET` | `/api/admin/tickets` | All tickets regardless of status |
| `PATCH` | `/api/admin/tickets/:id/status` | Approve or reject a vendor ticket |
| `PATCH` | `/api/admin/tickets/:id/advertise` | Toggle ticket homepage advertisement |
| `DELETE` | `/api/admin/tickets/:id` | Permanently delete a ticket |

---

## 📂 Source Code Control

| Metric | Status |
|--------|--------|
| **Production Commits** | ✅ 30+ backend-specific commits (endpoints, DB handlers, auth filters, fraud system, payment simulation) |
| **Reliability** | ✅ Zero console errors on startup — handles live environment requests cleanly across all routes |

---

## 📄 Licensing & Permissions

Copyright © 2026 **TicketBari API**.  
Developed by *Syed Ahmad Galib*

All project schemas and architecture configurations remain protected under educational distribution guidelines.

---

<div align="center">

**⚡ Built with Node.js, Express, MongoDB & Stripe — secure by design.**

⭐ *Star this repo if you trust the backend!*

</div>
