/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        navy: "#1A2B48",
        navy2: "#24375C",
        brand: "#2F80ED",
        safe: "#2E9A57",
        warn: "#E8A317",
        danger: "#E23D3D",
        page: "#F3F5F8",
      },
      boxShadow: {
        card: "0 8px 24px rgba(26, 43, 72, 0.08)",
      },
    },
  },
  plugins: [],
};
