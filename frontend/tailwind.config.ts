import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        custom: {
          darkest: "#2d2d2d",
          dark: "#424242",
          medium: "#696969",
          light: "#9f9f9f",
          lightest: "#bdbdbd",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
