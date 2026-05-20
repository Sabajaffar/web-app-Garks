// Backend API base URL — change this to your FastAPI server IP when testing on a real device
// For emulator: http://10.0.2.2:8000
// For physical device on same network: http://192.168.x.x:8000
// For local web testing: http://localhost:8000
export const API_BASE = 'http://10.0.2.2:8000';

// Mock API — FastAPI now serves all mock source endpoints on port 8000 (/warehouse, /supplier_email, etc.)
export const MOCK_API_BASE = 'http://10.0.2.2:8000';

// Gemini API key — set via .env or replace directly for testing
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// EmailJS config
export const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || '';
export const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || '';
export const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || '';
