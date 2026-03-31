import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PublicRoute from './PublicRoute'
import { vi } from 'vitest'

const TestComponent = () => <div data-testid="public-content">Public Content</div>
const DashboardPage = () => <div data-testid="dashboard-page">Dashboard Page</div>

describe('PublicRoute', () => {
  afterEach(() => {
    cleanup()
  })

  it('should render public content when user is not authenticated', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null
    })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <TestComponent />
              </PublicRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId('public-content')).toBeDefined()
  })

  it('should redirect to dashboard when user is authenticated', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => 'valid-token'
    })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <TestComponent />
              </PublicRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId('dashboard-page')).toBeDefined()
  })
})
