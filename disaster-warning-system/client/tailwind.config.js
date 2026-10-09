/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Emergency Blue & Vibrant Safety Orange Theme Palette
        "primary": "#1d4ed8",          // Royal Emergency Blue
        "primary-dark": "#1e3a8a",     // Deep Navy Blue
        "primary-light": "#3b82f6",    // Bright Blue
        "secondary": "#f97316",        // Safety Alert Orange
        "secondary-dark": "#c2410c",   // Deep Orange
        "secondary-light": "#ff9800",  // Bright Orange
        "accent-orange": "#ea580c",    // Emergency Orange Accent
        "surface": "#f8fafc",
        "surface-dark": "#0f172a",
        "background": "#f8fafc",
        "on-primary": "#ffffff",
        "on-secondary": "#ffffff",
        "on-background": "#0f172a",
        "error": "#dc2626",
        "success": "#16a34a",
        "warning": "#f97316",
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    }
  },
  plugins: [],
}
