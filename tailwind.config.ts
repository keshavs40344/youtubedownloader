import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#06070a",
          900: "#0b0e14",
          850: "#10141e",
          800: "#161b29",
          700: "#1e2437",
          600: "#2d374d",
        },
        brand: {
          violet: "#8b5cf6",
          indigo: "#6366f1",
          cyan: "#06b6d4",
          emerald: "#10b981",
          rose: "#f43f5e",
          amber: "#f59e0b",
        },
      },
      animation: {
        "float-slow": "floatSlow 8s ease-in-out infinite",
        "pulse-glow": "pulseGlow 5s ease-in-out infinite alternate",
        "gradient-x": "gradientX 12s ease infinite",
        "spin-slow": "spin 20s linear infinite",
        "soundwave": "soundwave 1.2s ease-in-out infinite alternate",
      },
      keyframes: {
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-12px) rotate(1deg)" },
        },
        pulseGlow: {
          "0%": { opacity: "0.25", transform: "scale(0.95)" },
          "100%": { opacity: "0.6", transform: "scale(1.05)" },
        },
        gradientX: {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        },
        soundwave: {
          "0%": { height: "4px" },
          "100%": { height: "24px" },
        },
      },
      backgroundImage: {
        "radial-glow": "radial-gradient(circle at 50% 0%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;