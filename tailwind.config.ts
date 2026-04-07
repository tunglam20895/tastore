import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "var(--color-cream)",
        blush: "var(--color-blush)",
        rose: "var(--color-rose)",
        espresso: "var(--color-espresso)",
        stone: {
          DEFAULT: "var(--color-stone)",
          100: "#ede8df",
          200: "#d9c9bc",
          300: "#bea38f",
          400: "#917366",
          500: "var(--color-stone)",
          600: "#4e3e37",
          700: "#3c2e28",
          800: "#2a1f1a",
          900: "#1A0A04",
        },
      },
      fontFamily: {
        heading: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
