# ATS Project - Tech Stack & Developer Setup Guide

This document outlines the architecture, frameworks, and specific versions established during **SCRUM-13** (Configure CI Pipeline & Monorepo). It serves as a reference for all collaborators to ensure a consistent development environment.

## 📦 Primary Technology Stack

### Global / Monorepo
*   **Architecture:** npm workspaces (Monorepo)
*   **Runtime:** Node.js (`>=20.0.0` LTS recommended)
*   **Package Manager:** npm (`>=10.0.0`)
*   **Concurrency:** `concurrently` (Cross-platform script execution)
*   **CI/CD:** GitHub Actions (Ubuntu runners)

### 🎨 Frontend (`apps/frontend`)
*   **Framework:** React (`^18.2.0`)
*   **Language:** TypeScript (`^5.0.0`)
*   **Build Tool:** Vite (`v8.x` compatible via `@vitejs/plugin-react@^4.3.4`)
*   **Testing:** Vitest + `jsdom` + React Testing Library
*   **Linting:** ESLint (`^8.57.0` - *Locked to v8 to use `.eslintrc.json`*)
*   **Styling:** Standard CSS (for now)

### ⚙️ Backend (`apps/backend`)
*   **Framework:** Express (`^4.18.2`)
*   **Language:** Node.js + TypeScript (`^5.0.0`)
*   **Database ORM:** Mongoose (`^8.3.0`) for MongoDB
*   **AI Integration:** Google Generative AI / Gemini (`@google/generative-ai@^0.6.0`)
*   **Authentication:** `bcrypt` & `jsonwebtoken`
*   **Testing:** Jest (`^29.5.0`) + Supertest + `mongodb-memory-server`
*   **Linting:** ESLint (`^8.57.0`)

---

## 🚀 Getting Started (Developer Setup)

Follow these steps to get the project running locally.

### 1. Prerequisites
Ensure you have the correct version of Node.js installed. If you are on Windows, ensure your PowerShell execution policies allow scripts (Run `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` as Administrator if you hit npm errors).

```bash
node -v # Should be 20.x.x
npm -v  # Should be 10.x.x
```

### 2. Install Dependencies
Because this is an npm workspace, you only need to run the install command **once at the root**. Do not run `npm install` inside the individual `apps/frontend` or `apps/backend` folders, as it will break the workspace symlinks.

```bash
# Run this in the root directory
npm install
```

### 3. Run the Development Servers
We use `concurrently` to spin up both the React frontend and the Express backend simultaneously in the same terminal.

```bash
npm run dev
```
*   **Frontend:** `http://localhost:3000`
*   **Backend API:** `http://localhost:5000` (Frontend automatically proxies `/api` requests to this port)

---

## 🛠️ Common Commands

Run these from the **root** of the project:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts both frontend and backend development servers. |
| `npm run build` | Compiles TypeScript and builds both applications. |
| `npm run test` | Runs Jest (backend) and Vitest (frontend) test suites. |
| `npm run lint` | Runs ESLint across all workspaces and automatically fixes standard issues. |

If you want to run a command for a specific workspace, use the `--workspace` flag:
```bash
npm run test --workspace=@ats/frontend
npm run build --workspace=@ats/backend
```

---

## ⚠️ Known Gotchas & Important Notes

1.  **ESLint Version Lock (`v8.x`)**
    We are strictly using ESLint `8.57.0`. ESLint v9+ introduces a breaking change ("Flat Config" / `eslint.config.js`). To maintain compatibility with our standard `.eslintrc.json` files, **do not force upgrade ESLint**.
2.  **Backend Jest Tests & ES Modules**
    The backend is configured as a native ES Module (`"type": "module"`). To support running `.ts` tests in this environment, we use `cross-env NODE_OPTIONS=--experimental-vm-modules jest`. This is handled automatically when you run `npm test`.
3.  **In-Memory MongoDB for Tests**
    You do not need a running MongoDB instance to run the backend tests! The backend test suite uses `mongodb-memory-server` to spin up a temporary, isolated database instance on the fly.
4.  **GitHub Actions CI**
    The CI pipeline (`.github/workflows/ci.yml`) is configured to run on every Pull Request to `main` and `develop`. It spins up a real MongoDB `6.0` service container to run integration tests securely. **You cannot merge code that fails the build, lint, or test checks.**