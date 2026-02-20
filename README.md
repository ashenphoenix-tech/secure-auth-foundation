# Spring Boot Auth Foundation

A production-oriented authentication foundation built with Java and Spring Boot for modern distributed systems.

This project provides a secure, stateless authentication core using RSA-signed JWT access tokens, rotating refresh tokens, HttpOnly cookies, and decentralized verification via JWKS — designed for real-world microservice environments.

---

## Why it's Needed ?

Authentication is frequently implemented with insecure defaults — symmetric keys, long-lived tokens, improper refresh handling, and tightly coupled validation logic.

Spring Boot Auth Foundation provides a security-first baseline that follows patterns used in scalable distributed architectures:

- Asymmetric signing for token integrity
- Short-lived stateless access tokens
- Rotating refresh token strategy
- Independent validation across services
- Externalized key management readiness

This is not a demo.  
It is a foundation intended for production hardening and extension.

## Intended Audience

This foundation is suitable for engineers building:

- Microservice-based architectures
- API gateway-based systems
- SaaS backends requiring stateless auth
- Distributed services requiring independent token validation

## 🔐 Security Model Overview

This authentication foundation is designed to mitigate common attack vectors:

- **Token Forgery** → RSA asymmetric signing
- **Token Replay** → Refresh token rotation strategy
- **CSRF Attacks** → SameSite + HttpOnly cookie configuration
- **Key Leakage** → Environment-based external key management
- **Service Coupling Risks** → Decentralized JWT validation via JWKS

Access tokens remain short-lived and stateless.  
Refresh tokens are rotated on every use to reduce replay exposure.

Private signing keys must never be committed or stored in plaintext configuration.

## ✨ Features

### 🔐 Secure Authentication

- RSA-signed JWT access tokens
- Public key exposure via JWKS endpoint
- Short-lived access tokens (stateless validation)

### 🔁 Rotating Refresh Tokens

- Refresh token rotation on every refresh call
- Secure HttpOnly cookie storage
- Path-restricted cookie configuration
- SameSite protection

### 🛡 Security Best Practices

- Asymmetric signing (RSA)
- Separation of auth-service and resource services
- Proper exception handling
- Input validation
- Clean architecture

### 🧱 Microservice Ready

- JWKS endpoint for distributed verification
- Roles embedded inside JWT
- Designed for independent token validation in other services

### 🎨 Premium Frontend

Minimal glassmorphism-inspired authentication UI

- Glassmorphism-based authentication UI
- Ready-to-integrate login and registration pages
- Clean and modern UX

## 🏗 Architecture Overview

This project follows a stateless authentication model:

1. User logs in
2. Auth-service issues:
   - Short-lived access token (returned in response body)
   - Long-lived refresh token (stored in HttpOnly cookie)
3. Resource services validate access tokens using JWKS
4. Refresh endpoint rotates refresh tokens securely

Auth-service does NOT validate business endpoints.
Each resource service is responsible for validating JWTs independently.

---

## 🛠 Tech Stack

Backend:

- Java 21
- Spring Boot
- Spring Security
- Nimbus JOSE + JWT
- REST APIs

Frontend:

- Modern React with Typescript
- Tailwind Css
- Apple Inspired Glassmorphism UI
- Clean responsive layout

---

## 🚀 Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/spring-boot-auth-foundation.git
cd spring-boot-auth-foundation
```

### 🔐 Generate Your Own RSA Key Pair (Mandatory Prerequisite)

This repository includes sample RSA keys for development purposes only.

⚠️ **You MUST generate a new RSA key pair before using this project in any real environment.**

If you do not regenerate the keys, multiple deployments may share the same signing keys — which completely compromises security.

You can generate a new RSA key pair using OpenSSL:

```bash
# Generate private key
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
# Extract public key
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

After generating:

- Replace the existing keys in your configuration
- Ensure the private key is never committed to version control
- Restrict file permissions appropriately

### ☁️ Production & Cloud Deployment

Private signing keys must never be stored in source control or plaintext configuration.

For production deployments, use a secure secrets management system such as:

- AWS Secrets Manager
- Azure Key Vault
- Google Secret Manager
- HashiCorp Vault

The application should retrieve the private key securely at runtime.

This ensures:

- No credential leakage via CI/CD
- No repository key exposure
- Proper key lifecycle management
- Compliance-ready deployment architecture

### 2️⃣ Configure Environment

Before running this project, update the following properties inside `application.yml`:

- Database configuration (PostgreSQL)
- `publicKey` & `privateKey`
- JWT expiration time (access & refresh)
- Issuer name
- CORS configuration
- `LoginRequest` & `SignupRequest` record (As per the login and signup requirements of your application)

If testing locally without an API Gateway:

- Disable the Gateway filter inside `SecurityConfig.java` (under the `security` package).

If you're testing this entire template, then you must run it via `docker-compose up` since postgres DB instance is created in dockerized container as a seperate service for this template.
**To run `docker-compose up` command you must have docker desktop and WSL installed on your machine**

---

### 💽 Database Setup (PostgreSQL)

This project expects a PostgreSQL database with UUID support enabled.
Connect to your PostgreSQL instance and execute the following schema scripts:

```sql
-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- USERS TABLE
-- =========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE
);

-- =========================
-- USER ROLES TABLE
-- =========================
CREATE TABLE user_roles (
    user_id UUID NOT NULL,
    role VARCHAR(100) NOT NULL,

    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE,

    CONSTRAINT user_roles_unique
        UNIQUE (user_id, role)
);

-- Optional index for faster lookups
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
```

Using a Different table for user authentication? then update these accordingly:

- Update the User entity accordingly
- Adjust the UserRepository
- Modify the UserService implementation to match your table
- Ensure roles are properly fetched and mapped to Spring Security authorities

The authentication logic depends on correctly loading:

- User identifier
- Encoded password
- Enabled status
- Associated roles

Make sure these fields are mapped properly.

### 3️⃣ Run the Application

By default the auth-service in this template will receive requests from gateway as auth-service is programmed to forbid direct requests and only allow requests from API Gateway with specific internal key

If you want to change this behaviour according to your application requirements then refer: `2️⃣ Configure Environment` step.

🔧 Backend (Spring Boot):
Run this application with

```maven
./mvnw spring-boot:run
```

**by default** the application will be live on `http://localhost:8080`,
if you run it as a individual service it'll be live on `http://localhost:8081` (if port number is NOT CHANGED EXPLICITLY in application.yaml for auth-service, else use the port which you mentioned).

Frontend (React + Vite):
If running the frontend included in this template:

- Navigate to the frontend directory:
  `cd frontend`
- Install dependencies:
  `npm install`
- Start the development server:
  `npm run dev`

The frontend will typically run on:
`http://localhost:5173`
Ensure your VITE_API_URL in the .env file correctly points to your running auth-service / api-gateway instance.

## auth-service Endpoints

Login
`POST /api/auth/login`

Returns:

- Access token (JSON response)
- Refresh token (HttpOnly cookie)

Refresh (Must be CALLED ONLY WHEN access token expires)
`POST /api/auth/refresh`

- Reads refresh token from cookie
- Validates signature and expiration
- Issues new access + refresh token
- Rotates refresh token

Returns:

- New Access token (JSON response)
- New Refresh token (HttpOnly cookie)

Logout
`POST /api/auth/logout`

Clears refresh token cookie

JWKS Endpoint

`GET /.well-known/jwks.json`

Public endpoint exposing the RSA public key in JSON Web Key Set (JWKS) format.

All of your other services must consume this endpoint to validate JWT signatures independently without coupling to the auth-service.

This enables:

- Decentralized authentication
- Independent service scaling
- Zero runtime token introspection calls

## Project Structure

auth-service
├── config
├── controller
├── dto
├── security
├── service
├── exception
├── entity
├── repository
├── filters

Clean separation of concerns.
Security configuration isolated.

## What This Version Includes

- Stateless rotating refresh tokens
- RSA-based JWT signing
- HttpOnly secure cookie strategy
- Role-based claim embedding
- JWKS exposure for your microservices

## License

MIT License

## Contributing

Contributions, discussions, and improvements are welcome.
If you find security issues or have architectural suggestions, open an issue or discussion.

## 🤝 Professional Support & Consulting

Maintained by **Ashen Phoenix**, a software engineering consultancy focused on building secure, scalable distributed systems.

This foundation can be extended and hardened for enterprise environments, including:

- Secure cloud key management integration
- Multi-service authentication architecture design
- Production security reviews and hardening
- Advanced authorization models (RBAC / ABAC)
- Custom authentication workflows

Authentication systems require careful infrastructure and operational decisions.

If you require implementation support or architectural consultation:

📩 Contact: whitephoenix.tec@gmail.com  
🌐 Organization: Ashen Phoenix

Engagements are scoped based on system complexity and security requirements.

## Standard consulting rates apply.

While this repository provides a solid authentication foundation, deploying authentication systems securely in production requires careful infrastructure, key management, and architectural decisions. If you’d like expert guidance, we’re happy to assist.

---
