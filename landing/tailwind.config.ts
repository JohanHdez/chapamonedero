import type { Config } from "tailwindcss";

/**
 * Tailwind comparte la paleta de marca con las variables --cm-* de globals.css.
 * Usa los tokens (bg-cm-primary, text-cm-muted, etc.) en vez de hex sueltos.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx,mdx}",
    "./lib/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cm: {
          primary: "var(--cm-primary)",
          "primary-shade": "var(--cm-primary-shade)",
          secondary: "var(--cm-secondary)",
          accent: "var(--cm-accent)",
          "accent-shade": "var(--cm-accent-shade)",
          danger: "var(--cm-danger)",
          success: "var(--cm-success)",
          cta: "var(--cm-cta)",
          "cta-shade": "var(--cm-cta-shade)",
          bg: "var(--cm-bg)",
          "bg-2": "var(--cm-bg-2)",
          surface: "var(--cm-surface)",
          "surface-2": "var(--cm-surface-2)",
          text: "var(--cm-text)",
          muted: "var(--cm-text-muted)",
          border: "var(--cm-border)",
        },
      },
      borderRadius: {
        cm: "var(--cm-radius)",
      },
      boxShadow: {
        cm: "var(--cm-shadow)",
      },
      fontFamily: {
        sans: ["Montserrat", "system-ui", "sans-serif"],
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};

export default config;
