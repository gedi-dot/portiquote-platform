import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Lake Magadi palette — slate & flamingo, from Kenya's soda lakes
        ink:       "#22303C", // slate — primary text / darkest surface
        sea:       "#486071", // steel blue — hero + dark surfaces
        tide:      "#7FB8A4", // alkaline green — interactive / success accent
        saffron:   "#EF7C9B", // flamingo — primary accent, CTAs
        coral:     "#E0566B", // deep crimson-pink — errors / live states
        parchment: "#F7F5F0", // salt — warm surface
        mist:      "#ECEFEA", // pale mineral — cool page background
        paper:     "#FBFCFB", // near-white surface
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
