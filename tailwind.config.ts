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
          100: "#f5f0ed",
          200: "#e8ddd8",
          300: "#d4c4bc",
          400: "#b8a49a",
          500: "var(--color-stone)",
          600: "#6e5d55",
          700: "#524540",
          800: "#3d322e",
          900: "#2C1A12",
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
