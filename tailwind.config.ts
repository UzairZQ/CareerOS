import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Lora", "serif"],
        display: ["Instrument Serif", "serif"],
      },
      boxShadow: {
        "dashboard-card": "0 22px 60px rgba(0, 0, 0, 0.28)",
        "soft-blue": "0 26px 70px rgba(44, 123, 229, 0.28)",
      },
    },
  },
  plugins: [],
};

export default config;
