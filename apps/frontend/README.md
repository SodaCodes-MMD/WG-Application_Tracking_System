# ATS Frontend - Password Reset Implementation

React frontend for the ATS Application password reset workflow.

## Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Styling:** CSS Modules

## Components

### ForgotPassword
Located at `/forgot-password`

Allows users to request a password reset email:
- Email validation with real-time feedback
- Security-conscious UI (same message regardless of email existence)
- Loading states
- Success confirmation screen

### ResetPassword
Located at `/reset-password?token=<token>`

Allows users to set a new password:
- Token validation on mount
- Password strength requirements checklist
- Password visibility toggle
- Real-time validation
- Success/error states

## Project Structure

```
src/
├── components/
│   ├── ForgotPassword.jsx    # Forgot password form
│   ├── ResetPassword.jsx     # Reset password form
│   └── AuthForms.css         # Shared auth styles
├── services/
│   └── api.js                # API client
├── App.jsx                   # Main app with routes
├── App.css                   # App styles
├── main.jsx                  # Entry point
└── index.css                 # Global styles
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update environment variables:
```env
VITE_API_URL=http://localhost:3000/api
```

4. Start development server:
```bash
npm run dev
```

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Landing page |
| `/forgot-password` | ForgotPassword | Request reset email |
| `/reset-password` | ResetPassword | Set new password |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:3000/api |

## Password Requirements

The reset form enforces strong passwords:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

## Testing

Run tests:
```bash
npm test
```

## Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.