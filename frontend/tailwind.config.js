/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#E63946',
        primaryDark: '#c1121f',
        secondary: '#FF6B35',
        accent: '#FFB703',
        dark: '#1a1a2e',
        surface: '#16213e',
        card: '#0f3460',
        light: '#f8f9fa',
        muted: '#6c757d',
        success: '#2d6a4f',
        warning: '#f4a261',
        danger: '#e63946'
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'bounce-subtle': 'bounceSub 0.5s ease',
        'pulse-ring': 'pulseRing 1.5s infinite'
      },
      keyframes: {
        slideIn: { from: { transform: 'translateY(-10px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        bounceSub: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.05)' } },
        pulseRing: { '0%': { boxShadow: '0 0 0 0 rgba(230,57,70,0.4)' }, '70%': { boxShadow: '0 0 0 10px rgba(230,57,70,0)' }, '100%': { boxShadow: '0 0 0 0 rgba(230,57,70,0)' } }
      }
    }
  },
  plugins: []
}
