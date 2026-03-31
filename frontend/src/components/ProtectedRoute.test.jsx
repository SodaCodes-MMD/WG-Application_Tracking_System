import React from 'react'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { vi } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

const TestComponent = () => <div data-testid="protected-content">Protected Content</div>
const LoginPage = () => <div data-testid="login-page">Login Page</div>

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('should show loading state while checking authentication', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))
    
    vi.stubGlobal('localStorage', {
      getItem: () => 'valid-token'
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Verifying authentication...')).toBeDefined()
  })

  it('should redirect to login when no token exists', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 })
    
    vi.stubGlobal('localStorage', {
      getItem: () => null
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeDefined()
    })
  })

  it('should render protected content when token is valid', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => 'valid-token'
    })
    mockFetch.mockResolvedValue({ ok: true, status: 200 })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeDefined()
    })
  })
})
