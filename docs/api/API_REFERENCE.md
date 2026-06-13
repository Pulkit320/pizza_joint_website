# Pizza Joint API Reference

This document outlines the authentication and role-based access control (RBAC) architecture for the Pizza Joint application.

---

## Authentication Endpoints

### 1. Customer Login
Authenticates customer accounts and issues a customer-specific JWT.

- **Endpoint:** `POST /api/v1/auth/customer/login`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "customer@pizza.com",
    "password": "password"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "id": "c0000000-0000-0000-0000-000000000001",
        "email": "customer@pizza.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "customer",
        "tier": "dough",
        "loyaltyBalance": 0
      }
    }
  }
  ```

- **JWT Payload Structure:**
  ```json
  {
    "userId": "c0000000-0000-0000-0000-000000000001",
    "email": "customer@pizza.com",
    "name": "John Doe",
    "role": "customer",
    "tier": "dough",
    "loyaltyBalance": 0,
    "jti": "550e8400-e29b-41d4-a716-446655440000",
    "iat": 1718280000,
    "exp": 1718884800
  }
  ```

---

### 2. Staff Login
Authenticates employee/staff accounts and issues a staff-specific JWT.

- **Endpoint:** `POST /api/v1/auth/staff/login`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "admin@pizza.com",
    "password": "password"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "id": "e0000000-0000-0000-0000-000000000002",
        "email": "admin@pizza.com",
        "firstName": "Admin",
        "lastName": "Boss",
        "role": "admin",
        "isAdmin": true
      }
    }
  }
  ```

- **JWT Payload Structure:**
  ```json
  {
    "userId": "e0000000-0000-0000-0000-000000000002",
    "email": "admin@pizza.com",
    "name": "Admin Boss",
    "role": "admin",
    "isAdmin": true,
    "jti": "3046bc0f-9ad0-4286-9a2b-d3ebfbe3b7d1",
    "iat": 1718280000,
    "exp": 1718884800
  }
  ```

---

### 3. General Login (Deprecated)
- **Endpoint:** `POST /api/v1/auth/login`
- **Status:** **DEPRECATED**. Emits server warnings. Developers must migrate client integrations to use the `/customer/login` or `/staff/login` endpoints.

---

### 4. Logout (Token Invalidation)
Invalidates the current session token using an in-memory JTI blacklist.

- **Endpoint:** `POST /api/v1/auth/logout`
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully."
  }
  ```

---

## Role Permissions Matrix

The following table summarizes the endpoints and the roles allowed to access them:

| Route / Endpoint | Auth Required | Allowed Roles | Middleware Guard |
| :--- | :---: | :--- | :--- |
| `POST /auth/register` | No | Anyone (Guest) | None |
| `POST /auth/customer/login` | No | Anyone (Guest) | None |
| `POST /auth/staff/login` | No | Anyone (Guest) | None |
| `GET /auth/me` | Yes | All Roles | `authenticateToken` |
| `POST /auth/logout` | Yes | All Roles | `authenticateToken` |
| `GET /loyalty/account` | Yes | `customer` | `requireRole('customer')` |
| `GET /loyalty/ledger` | Yes | `customer` | `requireRole('customer')` |
| `POST /loyalty/redeem` | Yes | `customer` | `requireRole('customer')` |
| `GET /loyalty/admin/overview` | Yes | `admin`, `manager` | `requireAdminRole` |
| `POST /loyalty/admin/grant` | Yes | `admin`, `manager` | `requireAdminRole` |
| `GET /loyalty/admin/customer/:id` | Yes | `admin`, `manager` | `requireAdminRole` |
| `POST /admin/run-tier-check` | Yes | `admin`, `manager` | `requireAdminRole` |
| `POST /admin/run-eotw-calculation`| Yes | `admin`, `manager` | `requireAdminRole` |
| `GET /employee/:employeeId` | Yes | `admin`, `manager` | `requireAdminRole` |
| `POST /employee/rating/:id/exclude`| Yes | `admin`, `manager` | `requireAdminRole` |

---

## Local Development Switcher

During development (`process.env.NODE_ENV === 'development'`), a floating widget appears in the bottom-right corner of the frontend page allowing developers to quickly simulate user and staff profiles with one-click:

| Simulation Target | Mock Credentials | Redirect Path |
| :--- | :--- | :--- |
| **Customer** | `customer@pizza.com` / `password` | `/account` |
| **Admin** | `admin@pizza.com` / `password` | `/admin` |
| **Kitchen Cook** | `cook@pizza.com` / `password123` | `/staff/kitchen` |
