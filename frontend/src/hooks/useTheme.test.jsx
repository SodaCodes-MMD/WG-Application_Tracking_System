import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import useTheme from "../hooks/useTheme.js";

describe("useTheme", () => {
  it("returns theme context value", () => {
    const mockThemeContext = {
      theme: "dark",
      toggleTheme: vi.fn(),
    };

    const wrapper = ({ children }) => (
      <ThemeContext.Provider value={mockThemeContext}>
        {children}
      </ThemeContext.Provider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current).toEqual(mockThemeContext);
  });

  it("returns theme property from context", () => {
    const mockThemeContext = {
      theme: "light",
      toggleTheme: vi.fn(),
    };

    const wrapper = ({ children }) => (
      <ThemeContext.Provider value={mockThemeContext}>
        {children}
      </ThemeContext.Provider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe("light");
  });

  it("returns toggleTheme function from context", () => {
    const mockToggleTheme = vi.fn();
    const mockThemeContext = {
      theme: "dark",
      toggleTheme: mockToggleTheme,
    };

    const wrapper = ({ children }) => (
      <ThemeContext.Provider value={mockThemeContext}>
        {children}
      </ThemeContext.Provider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.toggleTheme).toBe(mockToggleTheme);
  });
});
