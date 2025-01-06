import type { Config } from "tailwindcss";
import colors from 'tailwindcss/colors'; 

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
        textGrayLight: colors.gray['400'],            // #9ca3af
        textGrayDark: colors.gray['600'],             // #374151
        textLink: colors.sky['600'],                  // #0284c7
        textWhite: colors.gray['200'],                // #e5e7eb
      },
    },
  },
  plugins: [],
} satisfies Config;
