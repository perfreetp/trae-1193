/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          50: '#EFF4FF',
          100: '#D9E4FF',
          200: '#B5CCFF',
          300: '#8AA8FF',
          400: '#5C80FF',
          500: '#335CFF',
          600: '#165DFF',
          700: '#0E42D2',
          800: '#0A319E',
          900: '#072375',
        },
        danger: {
          50: '#FFECEC',
          100: '#FFC9C9',
          200: '#FF9D9D',
          300: '#FF6B6B',
          400: '#F53F3F',
          500: '#D91A1A',
          600: '#AD0E0E',
        },
        warning: {
          50: '#FFF5E6',
          100: '#FFE0B3',
          200: '#FFC87A',
          300: '#FFAC3D',
          400: '#FF8F1A',
          500: '#FF7D00',
        },
        success: {
          50: '#E8FBF0',
          100: '#B8F2CF',
          200: '#7CE6A5',
          300: '#3CD77A',
          400: '#0FC458',
          500: '#00B42A',
          600: '#008A20',
        },
        ink: {
          50: '#F7F8FA',
          100: '#EEF0F3',
          200: '#DADFE6',
          300: '#AEB5C0',
          400: '#7A8494',
          500: '#4E5969',
          600: '#2E3442',
          700: '#1D2129',
          800: '#121417',
          900: '#0A0B0D',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(29,33,41,0.04), 0 4px 16px rgba(29,33,41,0.06)',
        cardHover:
          '0 2px 8px rgba(22,93,255,0.08), 0 12px 32px rgba(29,33,41,0.10)',
        glow: '0 0 0 6px rgba(22,93,255,0.10)',
        breaking:
          '0 0 0 1px rgba(245,63,63,0.2), 0 6px 20px rgba(245,63,63,0.15)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 320ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'fade-in': 'fadeIn 260ms ease-out both',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'pulse-ring': 'pulseRing 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) 2',
        shimmer: 'shimmer 2.2s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.92' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(245,63,63,0.4)' },
          '100%': { boxShadow: '0 0 0 18px rgba(245,63,63,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'grid-soft':
          'radial-gradient(circle at 1px 1px, rgba(29,33,41,0.06) 1px, transparent 0)',
        'hero-glow':
          'radial-gradient(1200px 500px at 0% -10%, rgba(22,93,255,0.16), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(0,180,42,0.08), transparent 60%)',
      },
    },
  },
  plugins: [],
};
