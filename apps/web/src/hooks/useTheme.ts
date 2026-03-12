'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      // First run: sync React state with the DOM class set by the inline script.
      // Do NOT touch the DOM here — the inline script already applied the correct class.
      isFirstRun.current = false;
      const isLight = document.documentElement.classList.contains('light');
      setTheme(isLight ? 'light' : 'dark');
      return;
    }

    // Subsequent runs (user toggled): apply class + persist
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle } as const;
}

/**
 * Returns a counter that increments on every theme change.
 * Use as a useEffect dependency to re-create charts when theme switches.
 */
export function useThemeKey() {
  const [key, setKey] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setKey((k) => k + 1);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return key;
}
