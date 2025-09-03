import React, { useState, useEffect } from "react";
import { Sun, Moon } from "@phosphor-icons/react";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved preference or default to dark for agentic feel
    const savedTheme = localStorage.getItem('tready-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDark(shouldBeDark);
    updateTheme(shouldBeDark);
  }, []);

  const updateTheme = (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark-theme');
      document.body.classList.add('dark-theme');
      // Update CSS variables for dark mode
      document.documentElement.style.setProperty('--theme-bg-primary', 'var(--dark-bg-primary)');
      document.documentElement.style.setProperty('--theme-bg-secondary', 'var(--dark-bg-secondary)');
      document.documentElement.style.setProperty('--theme-text-primary', 'var(--dark-text-primary)');
      document.documentElement.style.setProperty('--theme-text-secondary', 'var(--dark-text-secondary)');
    } else {
      document.documentElement.classList.remove('dark-theme');
      document.body.classList.remove('dark-theme');
      // Reset to light theme
      document.documentElement.style.removeProperty('--theme-bg-primary');
      document.documentElement.style.removeProperty('--theme-bg-secondary');
      document.documentElement.style.removeProperty('--theme-text-primary');
      document.documentElement.style.removeProperty('--theme-text-secondary');
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    updateTheme(newTheme);
    localStorage.setItem('tready-theme', newTheme ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 p-3 rounded-xl glass-card transition-all hover:scale-105"
      aria-label="Toggle dark mode"
    >
      <div className={`relative w-6 h-6 transition-transform duration-500 ${isDark ? 'rotate-180' : ''}`}>
        {isDark ? (
          <Moon className="w-6 h-6 text-amber-400" weight="fill" />
        ) : (
          <Sun className="w-6 h-6 text-amber-500" weight="fill" />
        )}
      </div>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity" />
    </button>
  );
}