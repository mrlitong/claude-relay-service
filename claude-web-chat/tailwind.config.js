/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Reference our CSS variables
        'primary': 'rgb(var(--color-bg-primary) / <alpha-value>)',
        'secondary': 'rgb(var(--color-bg-secondary) / <alpha-value>)',
        'tertiary': 'rgb(var(--color-bg-tertiary) / <alpha-value>)',
        'hover': 'rgb(var(--color-bg-hover) / <alpha-value>)',
        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-tertiary': 'rgb(var(--color-text-tertiary) / <alpha-value>)',
        'border-primary': 'rgb(var(--color-border) / <alpha-value>)',
        'border-hover': 'rgb(var(--color-border-hover) / <alpha-value>)',
      },
      animation: {
        'in': 'in 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
      },
      keyframes: {
        'in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-bottom': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'rgb(var(--color-text-primary))',
            a: {
              color: 'rgb(var(--color-accent))',
              '&:hover': {
                color: 'rgb(var(--color-accent-hover))',
              },
            },
            h1: {
              color: 'rgb(var(--color-text-primary))',
            },
            h2: {
              color: 'rgb(var(--color-text-primary))',
            },
            h3: {
              color: 'rgb(var(--color-text-primary))',
            },
            h4: {
              color: 'rgb(var(--color-text-primary))',
            },
            code: {
              color: 'rgb(var(--color-accent))',
              backgroundColor: 'rgb(var(--color-accent) / 0.1)',
              padding: '0.25rem 0.375rem',
              borderRadius: '0.375rem',
              fontWeight: '400',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: '#1e1e2e',
              color: '#e1e1e1',
            },
            blockquote: {
              borderLeftColor: 'rgb(var(--color-accent))',
              color: 'rgb(var(--color-text-secondary))',
            },
          },
        },
      },
    },
  },
  plugins: [],
}