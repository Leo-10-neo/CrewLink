/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crew: {
          base: '#ffffff',
          surface: '#ffffff',
          primary: '#0f172a',
          secondary: '#64748b',
          accent: '#2563eb',
          accentHover: '#1d4ed8',
          accentLight: '#eff6ff',
          cyan: '#0ea5e9',
          border: '#e2e8f0',
          subtle: '#f8fafc',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 6px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 15px rgba(0, 0, 0, 0.03)',
        'premium': '0 20px 40px -10px rgba(0, 0, 0, 0.07)',
        'glow': '0 0 25px rgba(37, 99, 235, 0.25)',
        'card': '0 2px 8px -2px rgba(15, 23, 42, 0.06), 0 16px 32px -4px rgba(15, 23, 42, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'floatSlow 8s ease-in-out infinite',
        'float-delayed': 'floatSlow 10s ease-in-out 2s infinite',
        'float-reverse': 'floatReverse 9s ease-in-out 1s infinite',
        'ambient-drift': 'ambientDrift 16s ease-in-out infinite alternate',
        'ambient-drift-reverse': 'ambientDriftReverse 18s ease-in-out infinite alternate',
        'wave-flow-1': 'waveFlow1 12s ease-in-out infinite alternate',
        'wave-flow-2': 'waveFlow2 16s ease-in-out infinite alternate',
        'wave-flow-3': 'waveFlow3 20s ease-in-out infinite alternate',
        'pulse-glow': 'pulseGlow 8s ease-in-out infinite',
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(1.5deg)' },
        },
        floatReverse: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(12px) rotate(-1.5deg)' },
        },
        ambientDrift: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(35px, 25px) scale(1.08)' },
          '100%': { transform: 'translate(-20px, 15px) scale(0.96)' },
        },
        ambientDriftReverse: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(-30px, -20px) scale(1.06)' },
          '100%': { transform: 'translate(20px, -10px) scale(0.95)' },
        },
        waveFlow1: {
          '0%': { transform: 'translateX(0) translateY(0)' },
          '100%': { transform: 'translateX(25px) translateY(-8px)' },
        },
        waveFlow2: {
          '0%': { transform: 'translateX(0) translateY(0)' },
          '100%': { transform: 'translateX(-20px) translateY(10px)' },
        },
        waveFlow3: {
          '0%': { transform: 'translateX(0) translateY(0)' },
          '100%': { transform: 'translateX(15px) translateY(-5px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.05)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        }
      },
    },
  },
  plugins: [],
}
