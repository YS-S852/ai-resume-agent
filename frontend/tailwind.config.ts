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
        aurora: {
          purple: '#8B5CF6',
          cyan: '#06B6D4',
          pink: '#EC4899',
        },
        dark: {
          900: '#0a0a1a',
          800: '#0f0f2e',
          700: '#1a1a3e',
        }
      },
      animation: {
        'aurora-1': 'aurora1 18s ease-in-out infinite',
        'aurora-2': 'aurora2 22s ease-in-out infinite',
        'aurora-3': 'aurora3 20s ease-in-out infinite',
        'spin-slow': 'spin 4s linear infinite',
        'holo-flow': 'holoFlow 4s linear infinite',
        'spring-in': 'springIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'shine-sweep': 'shineSweep 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
