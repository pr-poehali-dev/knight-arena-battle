import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}"
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				cinzel: ['Cinzel', 'serif'],
				oswald: ['Oswald', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// Medieval palette
				stone: {
					900: '#1a1208',
					800: '#2d1f0a',
					700: '#3d2b0e',
					600: '#4e3812',
					500: '#6b4f1a',
				},
				gold: {
					DEFAULT: '#f0b429',
					light: '#ffd166',
					dark: '#c8860a',
				},
				crimson: {
					DEFAULT: '#c0392b',
					light: '#e74c3c',
					dark: '#922b21',
				},
				emerald: {
					DEFAULT: '#27ae60',
					light: '#2ecc71',
				},
				parchment: {
					DEFAULT: '#f5e6c8',
					dark: '#d4b896',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					from: { opacity: '0', transform: 'translateY(10px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					from: { opacity: '0', transform: 'scale(0.9)' },
					to: { opacity: '1', transform: 'scale(1)' }
				},
				'shake': {
					'0%, 100%': { transform: 'translateX(0)' },
					'20%': { transform: 'translateX(-8px)' },
					'40%': { transform: 'translateX(8px)' },
					'60%': { transform: 'translateX(-5px)' },
					'80%': { transform: 'translateX(5px)' },
				},
				'hit-flash': {
					'0%': { filter: 'brightness(1)' },
					'30%': { filter: 'brightness(3) saturate(0)' },
					'100%': { filter: 'brightness(1)' },
				},
				'slash': {
					'0%': { opacity: '0', transform: 'rotate(-45deg) scaleX(0)', transformOrigin: 'left' },
					'30%': { opacity: '1', transform: 'rotate(-45deg) scaleX(1)', transformOrigin: 'left' },
					'100%': { opacity: '0', transform: 'rotate(-45deg) scaleX(1)', transformOrigin: 'left' },
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-8px)' },
				},
				'torch-flicker': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.7' },
				},
				'slide-up': {
					from: { opacity: '0', transform: 'translateY(30px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'damage-float': {
					'0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
					'100%': { opacity: '0', transform: 'translateY(-60px) scale(1.4)' },
				},
				'bounce-attack': {
					'0%, 100%': { transform: 'translateX(0)' },
					'50%': { transform: 'translateX(30px)' },
				},
				'bounce-attack-left': {
					'0%, 100%': { transform: 'translateX(0)' },
					'50%': { transform: 'translateX(-30px)' },
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 10px #f0b429' },
					'50%': { boxShadow: '0 0 30px #f0b429, 0 0 60px #f0b429' },
				},
				'menu-enter': {
					from: { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
					to: { opacity: '1', transform: 'translateY(0) scale(1)' }
				},
				'spin-slow': {
					from: { transform: 'rotate(0deg)' },
					to: { transform: 'rotate(360deg)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.4s ease-out',
				'scale-in': 'scale-in 0.3s ease-out',
				'shake': 'shake 0.4s ease-in-out',
				'hit-flash': 'hit-flash 0.3s ease-out',
				'slash': 'slash 0.35s ease-out forwards',
				'float': 'float 3s ease-in-out infinite',
				'torch-flicker': 'torch-flicker 0.8s ease-in-out infinite',
				'slide-up': 'slide-up 0.5s ease-out',
				'damage-float': 'damage-float 1s ease-out forwards',
				'bounce-attack': 'bounce-attack 0.3s ease-in-out',
				'bounce-attack-left': 'bounce-attack-left 0.3s ease-in-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'menu-enter': 'menu-enter 0.5s ease-out forwards',
				'spin-slow': 'spin-slow 8s linear infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
