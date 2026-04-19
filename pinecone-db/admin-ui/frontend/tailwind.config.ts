// filepath: frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(210, 40%, 2%)",
        foreground: "hsl(210, 40%, 98%)",
        card: {
          DEFAULT: "hsl(210, 40%, 4%)",
          foreground: "hsl(210, 40%, 98%)",
        },
        popover: {
          DEFAULT: "hsl(210, 40%, 4%)",
          foreground: "hsl(210, 40%, 98%)",
        },
        primary: {
          DEFAULT: "hsl(199, 89%, 48%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        secondary: {
          DEFAULT: "hsl(210, 40%, 12%)",
          foreground: "hsl(210, 40%, 98%)",
        },
        muted: {
          DEFAULT: "hsl(210, 40%, 8%)",
          foreground: "hsl(215, 20.2%, 65.1%)",
        },
        accent: {
          DEFAULT: "hsl(210, 40%, 12%)",
          foreground: "hsl(210, 40%, 98%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 84.2%, 60.2%)",
          foreground: "hsl(210, 40%, 98%)",
        },
        border: "hsl(210, 40%, 10%)",
        input: "hsl(210, 40%, 10%)",
        ring: "hsl(199, 89%, 48%)",
      },
      borderRadius: {
        lg: "1rem",
        md: "calc(1rem - 2px)",
        sm: "calc(1rem - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
