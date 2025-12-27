import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Ace Noir Brand Colors
        'ace-black': '#1a1a1a',
        'ace-gold': '#C9A86C',
        'ace-gold-light': '#D4BC8E',
        'ace-gold-dark': '#B8955A',
        'ace-cream': '#F5F0E8',
        'ace-dark': '#0D0D0D',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
