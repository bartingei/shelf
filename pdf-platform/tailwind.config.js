/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        border: "hsl(var(--border))",
        accent: "hsl(var(--accent))",
        "accent-bright": "hsl(var(--accent-bright))",
        gold: "hsl(var(--gold))",
        "gold-bright": "hsl(var(--gold-bright))",
        muted: "hsl(var(--muted))",
        // Reader-specific theme tokens — swapped via .theme-paper / .theme-night classes
        "reader-bg": "var(--reader-bg)",
        "reader-text": "var(--reader-text)",
        "reader-accent": "var(--reader-accent)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        dyslexic: ["var(--font-dyslexic)", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
