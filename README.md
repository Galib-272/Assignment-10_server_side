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
| 🔐 **Custom Stateful JWT Middleware** | Restricts private operations (booking tickets, vendor actions, admin controls) using high-security JSON Web Token extraction routines with role verification. |
| 🌐 **CORS Security** | Strict domain whitelisting — only approved frontend production domains can connect. Blocks unauthorized API hits. |
| 💳 **Stripe Payment Pipeline** | Server-side Stripe payment intent creation for secure booking transactions. Full transaction logging with user, vendor, and ticket metadata. |
| ⚡ **Regex Query Aggregations** | Advanced indexing + case-insensitive `$regex` matching for lightning-fast ticket searches, transport type filters, and price-sorted result pipelines. |
| 🔄 **Safe Mutation Operations** | Ownership verification before any update or delete — protecting platform data from malicious requests. |
| 👥 **Multi-Role Authorization** | Three-tier role system (User, Vendor, Admin) enforced at the middleware level on all sensitive routes. |

---

## 🏗️ Core Technology Toolkit

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB (Mongoose ODM + native aggregation) |
| **Auth Protocol** | JSON Web Tokens (jsonwebtoken) |
| **Payment Gateway** | Stripe SDK (Payment Intents API) |
| **Social Auth** | Google OAuth (Google Cloud Console) |
| **Deployment** | Vercel Serverless Functions |

---

## 📋 Comprehensive API Endpoint Mapping

> All endpoints expect `application/json` request bodies and return consistent diagnostic responses.

### 🔓 Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check — API status heartbeat |
| `GET` | `/api/tickets` | Full ticket directory (supports search, type filter & price sorting) |
| `GET` | `/api/tickets/latest` | Latest 6 ticket listings for homepage showcase |
| `GET` | `/api/tickets/advertised` | Vendor-promoted tickets for homepage spotlight |
| `GET` | `/api/tickets/:id` | Complete ticket details for booking page |

### 🔒 Secured Ticket Endpoints (Requires Valid JWT Bearer Header)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tickets` | Create a new ticket listing (vendor only) |
| `PUT` | `/api/tickets/:id` | Update existing ticket fields |
| `DELETE` | `/api/tickets/:id` | Permanently delete a ticket |
| `PATCH` | `/api/tickets/:id/advertise` | Toggle ticket advertisement status |
| `PATCH` | `/api/tickets/:id/verify` | Admin ticket verification (approve/reject) |

### 📦 Booking Endpoints (Requires Valid JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/bookings` | Create a new booking record after payment |
| `GET` | `/api/bookings/user/:email` | Fetch all bookings for an authenticated user |
| `GET` | `/api/bookings/vendor/:email` | Fetch all booking requests for a vendor |
| `PATCH` | `/api/bookings/:id/status` | Vendor updates booking status (confirm/cancel) |

### 💳 Payment Endpoints (Requires Valid JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payment/create-payment-intent` | Create Stripe payment intent for checkout |
| `GET` | `/api/payment/transactions/user/:email` | User's personal transaction history |
| `GET` | `/api/payment/transactions/vendor/:email` | Vendor's revenue transaction history |
| `GET` | `/api/payment/transactions` | Admin — platform-wide all transactions |

### 👥 User Management Endpoints (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | Fetch all registered platform users |
| `PATCH` | `/api/users/:id/role` | Update user role (promote to vendor/admin) |
| `DELETE` | `/api/users/:id` | Remove a user from the platform |

---

## 📂 Source Code Control

| Metric | Status |
|--------|--------|
| **Production Commits** | ✅ 27+ notable backend-specific commits (endpoints, DB handlers, auth filters, Stripe integration) |
| **Reliability** | ✅ Zero console errors on startup — handles live environment requests cleanly across all routes |

---

## 📄 Licensing & Permissions

Copyright © 2026 **TicketBari API**.  
Developed by *Syed Ahmad Galib*

All project schemas and architecture configurations remain protected properties under educational distribution guidelines.

---

<div align="center">

**⚡ Built with Node.js, Express, MongoDB & Stripe — secure by design.**

⭐ *Star this repo if you trust the backend!*

</div>
