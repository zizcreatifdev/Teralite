import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'blue-teralite':  '#004880',
        'blue-dark':      '#002D50',
        'blue-light':     '#E8F0F8',
        'orange-teralite':'#FFA000',
        'orange-dark':    '#CC7A00',
        'orange-light':   '#FFF3DC',
        'green-teralite': '#1A6B3A',
        'green-light':    '#E6F4EC',
        'red-teralite':   '#B03A2E',
        'red-light':      '#FADBD8',
        'gray-fond':      '#F5F5F5',
        'text-main':      '#1A1A1A',
        'text-mid':       '#555555',
        'text-light':     '#888888',
        'border-main':    '#E5E5E5',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        'lg': '8px',
      },
    },
  },
  plugins: [],
}

export default config
