import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211b",
        forest: "#244d3a",
        sage: "#dfe9e2",
        cream: "#f6f3ec",
        amber: "#d99b45",
        line: "#dedbd2"
      },
      boxShadow: { soft: "0 18px 45px rgba(35,50,41,.08)" }
    }
  },
  plugins: []
} satisfies Config;
