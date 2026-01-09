// Accessibility utilities and high-contrast mode support
import { useState, useEffect } from "react";

type Theme = "light" | "dark" | "high-contrast";

// Get current theme
function getTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem("bookie-theme") as Theme) ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

// Set theme
function setTheme(theme: Theme): void {
  if (typeof window === "undefined") return;

  localStorage.setItem("bookie-theme", theme);

  // Remove existing theme classes
  document.documentElement.classList.remove("light", "dark", "high-contrast");

  // Add new theme class
  document.documentElement.classList.add(theme);

  // Dispatch event for React components
  window.dispatchEvent(new CustomEvent("themeChange", { detail: theme }));
}

// Initialize theme on page load
function initTheme(): void {
  const theme = getTheme();
  document.documentElement.classList.add(theme);
}

// Hook for React components
function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getTheme());

  useEffect(() => {
    initTheme();
    const handler = (e: CustomEvent<Theme>) => setThemeState(e.detail);
    window.addEventListener("themeChange", handler as EventListener);
    return () => window.removeEventListener("themeChange", handler as EventListener);
  }, []);

  return {
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme);
      setThemeState(newTheme);
    },
    isHighContrast: theme === "high-contrast",
    isDark: theme === "dark" || theme === "high-contrast",
  };
}

// Check if user prefers reduced motion
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Hook for reduced motion preference
function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(prefersReducedMotion());

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}

// Font size scaling
type FontScale = "normal" | "large" | "larger";

function getFontScale(): FontScale {
  if (typeof window === "undefined") return "normal";
  return (localStorage.getItem("bookie-font-scale") as FontScale) || "normal";
}

function setFontScale(scale: FontScale): void {
  if (typeof window === "undefined") return;

  localStorage.setItem("bookie-font-scale", scale);

  // Apply font scale using CSS custom property
  const sizes = { normal: "1rem", large: "1.125rem", larger: "1.25rem" };
  document.documentElement.style.setProperty("--font-base", sizes[scale]);

  window.dispatchEvent(new CustomEvent("fontScaleChange", { detail: scale }));
}

function useFontScale() {
  const [scale, setScaleState] = useState<FontScale>(getFontScale());

  useEffect(() => {
    const handler = (e: CustomEvent<FontScale>) => setScaleState(e.detail);
    window.addEventListener("fontScaleChange", handler as EventListener);
    return () => window.removeEventListener("fontScaleChange", handler as EventListener);
  }, []);

  return {
    fontScale: scale,
    setFontScale: (newScale: FontScale) => {
      setFontScale(newScale);
      setScaleState(newScale);
    },
  };
}

export {
  getTheme,
  setTheme,
  initTheme,
  useTheme,
  prefersReducedMotion,
  useReducedMotion,
  getFontScale,
  setFontScale,
  useFontScale,
  type Theme,
  type FontScale,
};
