// Railway production URL — replace YOUR_APP with your actual Railway subdomain
// e.g. https://garks-backend-production.up.railway.app
export const API_BASE = 'https://YOUR_APP.up.railway.app';
export const MOCK_API_BASE = 'https://YOUR_APP.up.railway.app';

// Gemini API key — set via .env or replace directly for testing
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// EmailJS config
export const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || '';
export const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || '';
export const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || '';
