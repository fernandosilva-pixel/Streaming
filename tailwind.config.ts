import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0B0F',
        surface: '#12121A',
        card: '#1A1A26',
        'card-hover': '#212132',
        border: '#2A2A3A',
        orange: {
          DEFAULT: '#FF6A00',
          light: '#FF8533',
          dark: '#D95800',
          glow: 'rgba(255, 106, 0, 0.25)',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A0B0',
          muted: '#666680',
        },
        live: '#FF3B3B',
        success: '#22C55E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0B0B0F 0%, #1A0A00 50%, #0B0B0F 100%)',
        'card-gradient': 'linear-gradient(135deg, #1A1A26 0%, #12121A 100%)',
        'orange-gradient': 'linear-gradient(135deg, #FF6A00 0%, #FF8533 100%)',
        'live-gradient': 'linear-gradient(90deg, #FF3B3B 0%, #FF6A00 100%)',
      },
      boxShadow: {
        'orange-glow': '0 0 20px rgba(255, 106, 0, 0.3)',
        'orange-glow-sm': '0 0 10px rgba(255, 106, 0, 0.2)',
        card: '0 4px 20px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.6)',
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        shimmer: 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
