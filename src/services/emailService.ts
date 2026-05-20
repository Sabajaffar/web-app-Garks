import emailjs from '@emailjs/browser';
import { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY } from '../config';

export async function sendSaleStartEmail(discount: number, duration: number) {
  const templateParams = {
    name: 'ShopAgent AI',
    sale_status: 'STARTED',
    discount: discount + '%',
    duration: duration + ' hours',
    timestamp: new Date().toLocaleString(),
    revenue_estimate: 'PKR ' + discount * 2000,
    agent_actions: 'Stock validated → Procurement notified',
  };

  try {
    if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
      console.log('Sale start email sent via EmailJS.');
    } else {
      console.warn('EmailJS credentials missing. Simulating:', templateParams);
    }
  } catch (error) {
    console.error('Failed to send sale start email:', error);
    throw error;
  }
}

export async function sendSaleEndEmail(discount: number, duration: number) {
  const templateParams = {
    name: 'ShopAgent AI',
    sale_status: 'ENDED',
    discount: discount + '%',
    duration: duration + ' hours',
    timestamp: new Date().toLocaleString(),
    revenue_estimate: 'PKR ' + discount * 2000,
    agent_actions: 'Catalog restored → Optimization complete',
  };

  try {
    if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
      console.log('Sale end email sent via EmailJS.');
    } else {
      console.warn('EmailJS credentials missing. Simulating:', templateParams);
    }
  } catch (error) {
    console.error('Failed to send sale end email:', error);
    throw error;
  }
}
