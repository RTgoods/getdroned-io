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
        'game-bg': '#07070f',
        'game-surface': '#0f0f1a',
        'game-surface-2': '#16162a',
        'game-border': '#1e1e3a',
        'game-accent': '#7c3aed',
        'game-accent-light': '#a78bfa',
      },
    },
  },
  plugins: [],
}

export default config
