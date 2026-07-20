/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@kamsnab/ui/tailwind.preset.cjs")],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ],
  plugins: [require("@tailwindcss/typography")]
};
