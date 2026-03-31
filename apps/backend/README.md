# ATS Backend - Password Reset Implementation

This backend implements a secure password reset workflow for the ATS Application.

## Tech Stack

- **Framework:** Node.js with Express
- **Database:** MongoDB with Mongoose ODM
- **Security:** bcrypt for password hashing, crypto for token generation
- **Validation:** express-validator

## Password Reset Flow

1. **Request Reset** - User submits email on `/api/auth/forgot-password`
2. **Token Generation** - Server creates a secure random token (hashed before storage)
3. **Email Notification** - Reset link sent to user's email (logged in dev mode)
4. **Token Validation** - User clicks link, token is validated on `/api/auth/validate-reset-token/:token`
5. **Password Update** - User submits new password on `/api/auth/reset-password`
6. **Cleanup** - Token is invalidated after use

## API Endpoints

### POST /api/auth/forgot-password
Request a password reset email.
```json
{
  "email": "user@example.com"
}
```

### GET /api/auth/validate-reset-token/:token
Validate a reset token before showing reset form.

### POST /api/auth/reset-password
Reset password with valid token.
```json
{
  "token": "reset-token-from-email",
  "password": "NewPassword123!"
}
```

## Security Features

- **Token Hashing:** Tokens are SHA-256 hashed before storage
- **Expiration:** Tokens expire after 1 hour
- **Single Use:** Tokens are deleted after successful reset
- **User Enumeration Protection:** Same response whether email exists or not
- **Password Requirements:**
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%*?&)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`:
- `MONGODB_URI` - MongoDB connection string
- `FRONTEND_URL` - Frontend application URL

4. Start the server:
```bash
npm run dev
```

## Testing

Run unit tests:
```bash
npm test
```

Tests cover:
- Token generation and validation
- Password reset success/failure paths
- Input validation
- Security measures (email enumeration prevention)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/ats_application |
| FRONTEND_URL | Frontend URL for email links | http://localhost:5173 |
| NODE_ENV | Environment mode | development |