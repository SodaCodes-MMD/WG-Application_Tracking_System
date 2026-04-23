# Frontend Testing Guide

This frontend uses Vitest with React Testing Library configured for browser-like component tests.

## Commands

- `npm test` runs the full test suite in CI mode.
- `npm run test:watch` starts Vitest in watch mode for local development.

## Test setup

Shared test setup is loaded from `src/test/setup.js`, which provides:

- `@testing-library/jest-dom` matchers (for example, `toBeInTheDocument`).
- automatic cleanup after each test.
- isolated test state by clearing `localStorage` and restoring mocks between tests.

## Best practices for frontend tests

- Test user-facing behavior (what renders, what users can do) instead of implementation details.
- Prefer Testing Library queries by accessibility: `getByRole`, `getByLabelText`, `getByText`.
- Keep tests deterministic: avoid depending on network calls, time, or external state without mocks.
- Use one behavior-focused assertion path per test and descriptive test names.
- Use helpers from `src/test/test-utils.jsx` for consistent providers and routing setup.

## Folder conventions

- Place tests near source files: `Component.test.jsx` or `feature.spec.jsx`.
- Put shared test helpers under `src/test`.
- Use `*.test.js`, `*.test.jsx`, `*.spec.js`, or `*.spec.jsx` file names so Vitest picks them up.
