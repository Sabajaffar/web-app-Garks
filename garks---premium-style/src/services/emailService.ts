import emailjs from '@emailjs/browser';

/**
 * Service to handle ShopAgent automated notification alerts (EmailJS + Web Notifications)
 */

export async function sendSaleStartEmail(discount: number, duration: number) {
  const serviceId = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || '';
  const templateId = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || '';
  const publicKey = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || '';

  const templateParams = {
    name: "ShopAgent AI",
    sale_status: "STARTED",
    discount: discount + "%",
    duration: duration + " hours",
    timestamp: new Date().toLocaleString(),
    revenue_estimate: "PKR " + (discount * 2000),
    agent_actions: "Stock validated → Procurement notified"
  };

  console.log("Preparing to send sale start notification...", templateParams);

  try {
    if (serviceId && templateId && publicKey) {
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      console.log("Sale started notification email sent successfully via EmailJS.");
    } else {
      console.warn("EmailJS credentials missing in environment. Simulating email sending:", templateParams);
    }
  } catch (error) {
    console.error("Failed to send sale start email via EmailJS:", error);
  }

  // Trigger Native Web Notification
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification("⚡ Flash Sale Live!", {
        body: `Agent launched ${discount}% OFF adaptive strategy`
      });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification("⚡ Flash Sale Live!", {
          body: `Agent launched ${discount}% OFF adaptive strategy`
        });
      }
    }
  }
}

export async function sendSaleEndEmail(discount: number, duration: number) {
  const serviceId = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || '';
  const templateId = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || '';
  const publicKey = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || '';

  const templateParams = {
    name: "ShopAgent AI",
    sale_status: "ENDED",
    discount: discount + "%",
    duration: duration + " hours",
    timestamp: new Date().toLocaleString(),
    revenue_estimate: "PKR " + (discount * 2000),
    agent_actions: "Catalog restored → Optimization complete"
  };

  console.log("Preparing to send sale end notification...", templateParams);

  try {
    if (serviceId && templateId && publicKey) {
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      console.log("Sale ended notification email sent successfully via EmailJS.");
    } else {
      console.warn("EmailJS credentials missing in environment. Simulating email sending:", templateParams);
    }
  } catch (error) {
    console.error("Failed to send sale end email via EmailJS:", error);
  }

  // Trigger Native Web Notification
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification("⚡ Flash Sale Expired!", {
        body: "Original prices restored."
      });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification("⚡ Flash Sale Expired!", {
          body: "Original prices restored."
        });
      }
    }
  }
}
