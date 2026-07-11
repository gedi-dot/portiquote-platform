import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink:       "#062A2E", // deepest ocean — primary text / darkest surface
        sea:       "#0B4A54", // brand teal — hero + dark surfaces
        tide:      "#16B3A6", // vivid turquoise — interactive / accent
        saffron:   "#F2A83B", // spice-trade gold — primary warm accent
        coral:     "#EF6A45", // rare pop — live / new states only
        parchment: "#F5EFE1", // warm surface
        mist:      "#E9F0EE", // cool page background
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
