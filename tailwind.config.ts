import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Hidden Leaf night-ops palette
        leaf: {
          50: "#eefbf1",
          100: "#d6f5dd",
          300: "#7ddb95",
          400: "#4cc46c",
          500: "#2fa34e",
          600: "#227f3d",
          700: "#1c6633",
        },
        chakra: "#38bdf8",
        flame: "#ff7a1a",
        bark: {
          900: "#0d1411",
          850: "#111a15",
          800: "#15201a",
          700: "#1b2922",
          600: "#24352c",
          500: "#2f4438",
        },
        parchment: "#e9dcc3",
        // rank hues
        rank: {
          academy: "#94a3b8",
          genin: "#22c55e",
          chunin: "#3b82f6",
          jonin: "#f97316",
          anbu: "#a855f7",
          kage: "#eab308",
          hokage: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(76,196,108,0.35), 0 0 24px -6px rgba(76,196,108,0.5)",
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 12px 32px -16px rgba(0,0,0,0.8)",
      },
      keyframes: {
        chakraPulse: {
          "0%,100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.06)" },
        },
        threadFlow: {
          to: { strokeDashoffset: "-24" },
        },
        riseIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        chakraPulse: "chakraPulse 2.4s ease-in-out infinite",
        threadFlow: "threadFlow 1s linear infinite",
        riseIn: "riseIn 0.35s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
