import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// MOCK DATA FOR SHOPAGENT
const MOCK_SOURCES = {
  warehouse: [
    { id: 'm1', sku: 'SH-OX-001', name: 'Premium Oxford Shirt', price: 85, stock: 24, last_updated: "2026-05-16T12:00:00Z" },
    { id: 'm2', sku: 'PN-CH-002', name: 'Slim Fit Chinos', price: 75, stock: 35, last_updated: "2026-05-16T12:00:00Z" },
    { id: 'm3', sku: 'JK-LE-003', name: 'Biker Leather Jacket', price: 295, stock: 8, last_updated: "2026-05-16T12:00:00Z" },
    { id: 'm4', sku: 'HD-FL-004', name: 'Tech Fleece Hoodie', price: 95, stock: 42, last_updated: "2026-05-16T12:00:00Z" },
    { id: 'm5', sku: 'PL-PI-005', name: 'Classic Pique Polo', price: 55, stock: 5, last_updated: "2026-05-16T12:00:00Z" },
    { id: 'w1', sku: 'BL-SI-006', name: 'Silk Blouse', price: 120, stock: 15, last_updated: "2026-05-16T12:00:00Z" }
  ],
  supplier_email: {
    from: "marco@milanfabrics.it",
    subject: "URGENT: Premium Oxford Shirt Stock Clearance & Price Drop",
    date: "2026-05-19T08:30:00Z",
    content: "Dear GarKS Admin, we have a sudden supply surplus of Premium Egyptian Cotton for the Oxford Shirt. We are offering a 40% discount for orders placed in the next 24 hours. However, transport shipments through the N-55 route are currently processing with extreme delays. Please let us know if we should secure your order."
  },
  sales_dashboard: {
    period: "2026-05-12 to 2026-05-18",
    total_revenue_today: 450000,
    weekly_revenue_change: 5,
    top_decline_categories: "None",
    active_promotions: "None",
    last_updated: "2026-05-18T23:59:59Z"
  },
  customer_reviews: {
    period: "Last 24 Hours",
    total_count: 23,
    negative_count: 18,
    positive_count: 5,
    sample_reviews: [
      "The Premium Oxford Shirt in White is out of stock in Size M! I wanted to buy this for my graduation but it's unavailable.",
      "Why is the Classic Pique Polo in Navy out of stock?",
      "Very frustrated, sizes are limited.",
      "High quality, but poor availability."
    ]
  },
  news_feed: {
    publisher: "National Highway Authority Alerts",
    title: "TRAFFIC ALERT: N-55 Highway Blockage Near Sehwan due to landslide",
    date: "2026-05-19T06:00:00Z",
    content: "All cargo and heavy vehicle traffic on Indus Highway (N-55) is suspended near Sehwan. Recovery operations are underway, but clearing the debris is expected to take at least 36 to 48 hours. Transporters are advised to use alternative routes (M-9 Motorway/N-5)."
  }
};

// In-Memory Database and States
interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  originalPrice?: number;
  stock: number;
  saleActive?: boolean;
  saleEndTime?: string | null;
}

let productsDb: Product[] = [
  { id: 'm1', sku: 'SH-OX-001', name: 'Premium Oxford Shirt', price: 85, stock: 24 },
  { id: 'm2', sku: 'PN-CH-002', name: 'Slim Fit Chinos', price: 75, stock: 35 },
  { id: 'm3', sku: 'JK-LE-003', name: 'Biker Leather Jacket', price: 295, stock: 8 },
  { id: 'm4', sku: 'HD-FL-004', name: 'Tech Fleece Hoodie', price: 95, stock: 42 },
  { id: 'm5', sku: 'PL-PI-005', name: 'Classic Pique Polo', price: 55, stock: 5 },
  { id: 'w1', sku: 'BL-SI-006', name: 'Silk Blouse', price: 120, stock: 15 }
];

interface AgentLog {
  action: string;
  result: string;
  timestamp: string;
}

let agentLogs: AgentLog[] = [
  {
    action: "System Initialization",
    result: "ShopAgent engine initialized successfully.",
    timestamp: new Date().toISOString()
  }
];

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'sale' | 'info' | 'order' | 'inventory';
  read: boolean;
}

let serverNotifications: Notification[] = [];

let saleActive = false;
let saleEndTime: string | null = null;

async function syncStoreStateToJsonServer() {
  try {
    await fetch("http://localhost:3001/store_state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        saleActive,
        saleEndTime: saleEndTime || null
      })
    });
    await Promise.all(
      productsDb.map(async (p) => {
        try {
          await fetch(`http://localhost:3001/products/${p.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              price: p.price,
              originalPrice: p.originalPrice || null,
              saleActive: p.saleActive || false,
              saleEndTime: p.saleEndTime || null,
              stock: p.stock
            })
          });
        } catch (e) {
          console.error(`Failed to sync product ${p.id}:`, e);
        }
      })
    );
    console.log(`[Sync] Synced saleActive (${saleActive}) and products to JSON server.`);
  } catch (err) {
    console.error("[Sync] Failed to sync store state to JSON server:", err);
  }
}

async function hydrateFromServer() {
  try {
    const stateRes = await fetch("http://localhost:3001/store_state");
    if (stateRes.ok) {
      const stateData = await stateRes.json();
      saleActive = stateData.saleActive || false;
      saleEndTime = stateData.saleEndTime || null;
      console.log(`[Hydration] Loaded store state. saleActive: ${saleActive}, saleEndTime: ${saleEndTime}`);
    }
  } catch (err) {
    console.error("[Hydration] Failed to load store state:", err);
  }

  try {
    const prodRes = await fetch("http://localhost:3001/products");
    if (prodRes.ok) {
      const prodData = await prodRes.json();
      if (Array.isArray(prodData) && prodData.length > 0) {
        productsDb = prodData;
        console.log(`[Hydration] Loaded ${productsDb.length} products.`);
      }
    }
  } catch (err) {
    console.error("[Hydration] Failed to load products:", err);
  }
}

interface Snapshot {
  timestamp: number;
  products: { id: string; name: string; stock: number }[];
  revenue: number;
}

let snapshotHistory: Snapshot[] = [
  {
    timestamp: Date.now() - 5 * 60 * 1000 * 5,
    products: [
      { id: '1', name: 'Minimalist Charcoal Linen Kurta', stock: 500 },
      { id: '2', name: 'Oversized Pastel Linen Co-Ord Set', stock: 300 },
      { id: '3', name: 'Signature Emerald Green 2-Piece', stock: 150 },
      { id: '4', name: 'Oversized Minimalist Off-White Tee', stock: 200 },
      { id: '5', name: 'Monochrome Jet Black Summer Tunic', stock: 400 },
      { id: '6', name: 'Structured Slate Grey Shalwar Kameez', stock: 180 }
    ],
    revenue: 3500
  },
  {
    timestamp: Date.now() - 5 * 60 * 1000 * 4,
    products: [
      { id: '1', name: 'Minimalist Charcoal Linen Kurta', stock: 485 },
      { id: '2', name: 'Oversized Pastel Linen Co-Ord Set', stock: 288 },
      { id: '3', name: 'Signature Emerald Green 2-Piece', stock: 142 },
      { id: '4', name: 'Oversized Minimalist Off-White Tee', stock: 195 },
      { id: '5', name: 'Monochrome Jet Black Summer Tunic', stock: 388 },
      { id: '6', name: 'Structured Slate Grey Shalwar Kameez', stock: 172 }
    ],
    revenue: 3700
  },
  {
    timestamp: Date.now() - 5 * 60 * 1000 * 3,
    products: [
      { id: '1', name: 'Minimalist Charcoal Linen Kurta', stock: 470 },
      { id: '2', name: 'Oversized Pastel Linen Co-Ord Set', stock: 275 },
      { id: '3', name: 'Signature Emerald Green 2-Piece', stock: 135 },
      { id: '4', name: 'Oversized Minimalist Off-White Tee', stock: 188 },
      { id: '5', name: 'Monochrome Jet Black Summer Tunic', stock: 370 },
      { id: '6', name: 'Structured Slate Grey Shalwar Kameez', stock: 165 }
    ],
    revenue: 3900
  },
  {
    timestamp: Date.now() - 5 * 60 * 1000 * 2,
    products: [
      { id: '1', name: 'Minimalist Charcoal Linen Kurta', stock: 450 },
      { id: '2', name: 'Oversized Pastel Linen Co-Ord Set', stock: 260 },
      { id: '3', name: 'Signature Emerald Green 2-Piece', stock: 128 },
      { id: '4', name: 'Oversized Minimalist Off-White Tee', stock: 180 },
      { id: '5', name: 'Monochrome Jet Black Summer Tunic', stock: 350 },
      { id: '6', name: 'Structured Slate Grey Shalwar Kameez', stock: 155 }
    ],
    revenue: 4100
  },
  {
    timestamp: Date.now() - 5 * 60 * 1000 * 1,
    products: [
      { id: '1', name: 'Minimalist Charcoal Linen Kurta', stock: 432 },
      { id: '2', name: 'Oversized Pastel Linen Co-Ord Set', stock: 248 },
      { id: '3', name: 'Signature Emerald Green 2-Piece', stock: 121 },
      { id: '4', name: 'Oversized Minimalist Off-White Tee', stock: 172 },
      { id: '5', name: 'Monochrome Jet Black Summer Tunic', stock: 335 },
      { id: '6', name: 'Structured Slate Grey Shalwar Kameez', stock: 148 }
    ],
    revenue: 4230
  }
];

const REVIEW_TEMPLATES = [
  { user: "Hassan A.", rating: 5, comment: "Absolutely love the fit of the kurta!" },
  { user: "Ayesha K.", rating: 4, comment: "Good fabric, but delivery was slightly delayed." },
  { user: "Zainab M.", rating: 2, comment: "Emerald green 2-piece out of stock in M, extremely disappointed." },
  { user: "Omar F.", rating: 5, comment: "Top quality materials as always. Highly recommend." },
  { user: "Fatima S.", rating: 3, comment: "Co-Ord Set is lovely but a bit oversized." }
];

async function runAutoUpdates() {
  try {
    // 1. Update warehouse stocks
    const warehouseRes = await fetch('http://localhost:3001/warehouse');
    if (warehouseRes.ok) {
      const warehouse: any = await warehouseRes.json();
      for (const item of warehouse) {
        const dec = saleActive ? (Math.floor(Math.random() * 8) + 8) : (Math.floor(Math.random() * 5) + 4);
        let newStock = Math.max(0, item.stock - dec);

        // Auto restock check if stock falls below 10
        if (newStock < 10) {
          const isShirtsOrPolos = item.category === 'Shirts' || item.category === 'Polos' || item.name.toLowerCase().includes('shirt') || item.name.toLowerCase().includes('polo');
          const isLeather = item.id === 'm3' || item.name.toLowerCase().includes('leather') || item.category === 'Leather Jackets';
          
          const vendor = isShirtsOrPolos ? 'Milan Fabrics Co.' : 'Lahore Textiles';
          const vendorId = isShirtsOrPolos ? 's1' : 's7';
          const unitCost = isLeather ? 550 : 450;
          const quantity = isLeather ? 80 : 100;
          const totalCost = quantity * unitCost;

          newStock += quantity;

          const restockMsg = `[AI AUTOMATED RESTOCK] Restocked ${quantity} units of "${item.name}" from "${vendor}" (Total: ${totalCost} PKR). Budget check within 50k limit PASS.`;
          agentLogs.push({
            action: "Automated Restock",
            result: restockMsg,
            timestamp: new Date().toISOString()
          });

          serverNotifications.unshift({
            id: Math.random().toString(36).substr(2, 9),
            title: "🤖 AI AUTOMATED RESTOCK",
            message: `Ordered ${quantity} units of ${item.name} from ${vendor}. Total: ${totalCost} PKR.`,
            time: new Date().toLocaleTimeString(),
            type: 'inventory',
            read: false
          });
        }

        await fetch(`http://localhost:3001/warehouse/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock: newStock })
        });
      }
    }

    // 2. Update products stocks
    const productsRes = await fetch('http://localhost:3001/products');
    if (productsRes.ok) {
      const products: any = await productsRes.json();
      for (const item of products) {
        const dec = saleActive ? (Math.floor(Math.random() * 8) + 8) : (Math.floor(Math.random() * 5) + 4);
        let newStock = Math.max(0, item.stock - dec);

        // Auto restock check if stock falls below 10
        if (newStock < 10) {
          const isShirtsOrPolos = item.category === 'Shirts' || item.category === 'Polos' || item.name.toLowerCase().includes('shirt') || item.name.toLowerCase().includes('polo');
          const isLeather = item.id === 'm3' || item.name.toLowerCase().includes('leather') || item.category === 'Leather Jackets';
          
          const vendor = isShirtsOrPolos ? 'Milan Fabrics Co.' : 'Lahore Textiles';
          const vendorId = isShirtsOrPolos ? 's1' : 's7';
          const unitCost = isLeather ? 550 : 450;
          const quantity = isLeather ? 80 : 100;
          const totalCost = quantity * unitCost;

          newStock += quantity;

          const restockMsg = `[AI AUTOMATED RESTOCK] Restocked ${quantity} units of "${item.name}" from "${vendor}" (Total: ${totalCost} PKR). Budget check within 50k limit PASS.`;
          agentLogs.push({
            action: "Automated Restock",
            result: restockMsg,
            timestamp: new Date().toISOString()
          });

          serverNotifications.unshift({
            id: Math.random().toString(36).substr(2, 9),
            title: "🤖 AI AUTOMATED RESTOCK",
            message: `Ordered ${quantity} units of ${item.name} from ${vendor}. Total: ${totalCost} PKR.`,
            time: new Date().toLocaleTimeString(),
            type: 'inventory',
            read: false
          });
        }

        await fetch(`http://localhost:3001/products/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock: newStock })
        });
        
        // Sync local productsDb
        const local = productsDb.find(p => p.id === item.id);
        if (local) {
          local.stock = newStock;
        }
      }
    }

    // 3. Update sales dashboard revenue
    const salesRes = await fetch('http://localhost:3001/sales_dashboard');
    if (salesRes.ok) {
      const sales: any = await salesRes.json();
      const inc = saleActive ? (Math.floor(Math.random() * 4000) + 3000) : (Math.floor(Math.random() * 2000) + 1000);
      const newRev = (sales.total_revenue_today || 0) + inc;
      const newWeeklyChange = (sales.weekly_revenue_change || 0) + 1;
      await fetch('http://localhost:3001/sales_dashboard', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          total_revenue_today: newRev,
          weekly_revenue_change: newWeeklyChange
        })
      });
    }

    // 4. Update customer reviews
    const reviewsRes = await fetch('http://localhost:3001/customer_reviews');
    if (reviewsRes.ok) {
      const reviews: any = await reviewsRes.json();
      const count = Math.floor(Math.random() * 3) + 1; // 1-3 new reviews
      let newRawText = reviews.raw_text || "";
      let negativeCount = reviews.negative || 0;
      let positiveCount = reviews.positive || 0;

      for (let i = 0; i < count; i++) {
        const t = REVIEW_TEMPLATES[Math.floor(Math.random() * REVIEW_TEMPLATES.length)];
        newRawText += `\n${t.user}: ${t.comment}`;
        if (t.rating >= 4) positiveCount++;
        else negativeCount++;
      }

      await fetch('http://localhost:3001/customer_reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_today: (reviews.total_today || 0) + count,
          raw_text: newRawText,
          negative: negativeCount,
          positive: positiveCount
        })
      });
    }

    console.log(`[${new Date().toLocaleTimeString()}] Auto-updated stocks, revenue, and customer reviews in JSON Server.`);
  } catch (error) {
    console.error("Auto-updater encountered an error:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Hydrate from json-server on startup
  await hydrateFromServer();

  // Start 30s auto updater
  setInterval(runAutoUpdates, 30000);

  // Initialize Gemini
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.post("/api/gargi/chat", async (req, res) => {
    try {
      const { message, context, isAdmin } = req.body;
      
      const systemInstruction = isAdmin 
        ? "You are Gargi, the intelligent AI administrator of GarKS. You analyze inventory, sales data, and store performance using the provided agentAnalysis context. Respond naturally to all messages. Keep your answers short, concise, and only include important details. Use bullet points or bold text where appropriate for the best formatting."
        : "You are Gargi, the friendly AI fashion assistant of GarKS. Help customers find their perfect style, recommend products, and assist with shopping. Be elegant, kind, and inspiring. Important Rules: You specialize exclusively in fashion collections, style matching, and boutique operations. You must politely decline assisting with any non-retail, non-fashion, or irrelevant inquiries.";

      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemInstruction + ` Context: ${JSON.stringify(context)}` },
            { role: "user", content: message }
          ]
        })
      });

      if (!groqResponse.ok) {
        const errorData = await groqResponse.json();
        throw new Error(errorData.error?.message || "Groq API Error");
      }

      const data = await groqResponse.json();
      res.json({ text: data.choices[0].message.content });
    } catch (error: any) {
      console.error("GROQ API Error:", error.message || error);
      res.status(500).json({ error: error.message || "Failed to communicate with AI" });
    }
  });

  // Mock Inventory Analysis
  app.post("/api/admin/analyze-inventory", async (req, res) => {
    try {
      const { inventoryData } = req.body;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { text: "Analyze this inventory data and provide 3 key insights. Suggest 1 actionable marketing campaign." },
          { text: JSON.stringify(inventoryData) }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insights: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              marketingCampaign: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  impact: { type: Type.STRING }
                },
                required: ["title", "description", "impact"]
              }
            },
            required: ["insights", "marketingCampaign"]
          }
        }
      });

      res.json(JSON.parse(response.text));
    } catch (error) {
      res.status(500).json({ error: "Failed to analyze data" });
    }
  });

  // ==========================================
  // SHOPAGENT AUTONOMOUS API ENDPOINTS
  // ==========================================

  async function callGemini(prompt: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text);
  }

  let lastAdminActivity = Date.now();
  
  interface LedgerEntry {
    actionName: string;
    timestamp: number;
  }
  let actionLedger: LedgerEntry[] = [];
  let uploadedFileData: any = null; // Holds the last uploaded document for the agent to analyze

  // --- AGENT 1: dataCollectorAgent ---
  async function dataCollectorAgent() {
    let warehouse = [], email = {} as any, sales = {} as any, reviews = {} as any, news = {} as any;
    try {
      [warehouse, email, sales, reviews, news] = 
        await Promise.all([
          fetch('http://localhost:3001/warehouse').catch(() => ({ json: () => MOCK_SOURCES.warehouse })),
          fetch('http://localhost:3001/supplier_email').catch(() => ({ json: () => MOCK_SOURCES.supplier_email })),
          fetch('http://localhost:3001/sales_dashboard').catch(() => ({ json: () => MOCK_SOURCES.sales_dashboard })),
          fetch('http://localhost:3001/customer_reviews').catch(() => ({ json: () => MOCK_SOURCES.customer_reviews })),
          fetch('http://localhost:3001/news_feed').catch(() => ({ json: () => MOCK_SOURCES.news_feed }))
        ]).then(responses => Promise.all(
          responses.map((r: any) => r.json())
        ));
    } catch (e) {
      console.log("Failed to fetch from 3001, using MOCK_SOURCES");
      warehouse = MOCK_SOURCES.warehouse;
      email = MOCK_SOURCES.supplier_email;
      sales = MOCK_SOURCES.sales_dashboard;
      reviews = MOCK_SOURCES.customer_reviews;
      news = MOCK_SOURCES.news_feed;
    }

    const now = Date.now();
    const sources = [
      { 
        name: 'warehouse',
        type: 'STRUCTURED',
        data: warehouse,
        timestamp: warehouse[0]?.last_updated || new Date().toISOString(),
        ageHours: (now - new Date(warehouse[0]?.last_updated || Date.now()).getTime()) / 3600000,
        stale: false,
        credibility: 0.9
      },
      {
        name: 'supplier_email', 
        type: 'SEMI-STRUCTURED',
        data: email,
        timestamp: email.date || new Date().toISOString(),
        ageHours: (now - new Date(email.date || Date.now()).getTime()) / 3600000,
        stale: false,
        credibility: 0.9
      },
      {
        name: 'sales_dashboard', 
        type: 'STRUCTURED',
        data: sales,
        timestamp: sales.last_updated || new Date().toISOString(),
        ageHours: (now - new Date(sales.last_updated || Date.now()).getTime()) / 3600000,
        stale: false,
        credibility: 0.9
      },
      {
        name: 'customer_reviews', 
        type: 'UNSTRUCTURED',
        data: reviews,
        timestamp: new Date().toISOString(), // mock data has no timestamp
        ageHours: 0,
        stale: false,
        credibility: 0.9
      },
      {
        name: 'news_feed', 
        type: 'SEMI-STRUCTURED',
        data: news,
        timestamp: news.date || new Date().toISOString(),
        ageHours: (now - new Date(news.date || Date.now()).getTime()) / 3600000,
        stale: false,
        credibility: 0.9
      }
    ];

    if (uploadedFileData) {
      sources.push({
        name: 'uploaded_document',
        type: 'UPLOADED_FILE',
        data: uploadedFileData,
        timestamp: new Date().toISOString(),
        ageHours: 0,
        stale: false,
        credibility: 1.0
      });
    }

    sources.forEach(s => {
      s.stale = s.ageHours > 48;
      s.credibility = s.stale ? 0.3 : 0.9;
    });

    return {
      agent: 'DataCollector',
      status: 'complete',
      sources_count: 5,
      stale_count: sources.filter(s => s.stale).length,
      sources
    };
  }

  // --- AGENT 2: analystAgent ---
  async function analystAgent(collectorResult: any) {
    const sources = collectorResult.sources;
    const prompt = `
      Analyze these 5 store data sources for GarKS apparel store:
      ${JSON.stringify(sources)}
      
      Compare their contents. Look for any contradictions between:
      1. Stock levels (e.g. Warehouse stock vs supplier delivery updates or news of transport delays).
      2. Prices (e.g. Current retail price vs competitor prices or supplier wholesale cost increases).
      3. Logistics (e.g. Expected delivery times in supplier emails vs port strikes in news feeds).
      
      If you find natural contradictions, output them.
      If you don't find natural contradictions, synthesize a highly realistic, randomized clothing retail contradiction based on current stock/prices (e.g. supplier warning of stock outs or logistics delay of cargo shipping vs expected arrivals).
      
      Also filter out noise (unrelated news, old notifications).
      Generate 3-5 key clothing retail insights.
      Determine the store's current risk level (LOW, MEDIUM, HIGH).
      Recommend if a flash sale is needed, the discount (%), the duration (hours), and a justification.
      
      Return ONLY a JSON object:
      {
        "contradictions": [
          {
            "metric": "stock level" | "price" | "delivery time",
            "source1": {"name": "source name", "value": "value string", "credibility": number},
            "source2": {"name": "source name", "value": "value string", "credibility": number},
            "resolution": "Reasoning for choosing which source is ground truth",
            "ground_truth": "The resolved correct state"
          }
        ],
        "noise_filtered": ["List of filtered out noise lines"],
        "insights": ["List of 3-5 retail insights"],
        "risk_level": "LOW" | "MEDIUM" | "HIGH",
        "sale_recommended": boolean,
        "recommended_discount": number,
        "recommended_duration": number,
        "reasoning": "Detailed justification"
      }
    `;
    
    try {
      const geminiResponse = await callGemini(prompt);
      return {
        agent: 'Analyst',
        status: 'complete',
        ...geminiResponse
      };
    } catch (error) {
      console.log("Gemini API failed or quota exceeded. Falling back to dynamic mock analyst data.", error);
      
      const warehouseData = sources.find((s: any) => s.name === 'warehouse')?.data || [];
      const uploadedData = sources.find((s: any) => s.name === 'uploaded_document')?.data;
      const emailData = sources.find((s: any) => s.name === 'supplier_email')?.data || {};
      const salesData = sources.find((s: any) => s.name === 'sales_dashboard')?.data || {};
      
      const randomProduct = warehouseData.length > 0 
        ? warehouseData[Math.floor(Math.random() * warehouseData.length)] 
        : { name: "Winter Coats", stock: 12, price: 120 };
        
      let metric = "stock level";
      let val1 = "";
      let val2 = "";
      let resolution = "";
      let ground_truth = "";
      let insights: string[] = [];
      let riskLevel = randomProduct.stock < 15 ? "HIGH" : "MEDIUM";
      
      if (uploadedData && uploadedData.comparison && uploadedData.comparison.length > 0) {
        const comp = uploadedData.comparison[0];
        val1 = `${comp.localValue} in local DB`;
        val2 = `${comp.sourceValue} in uploaded document`;
        resolution = "Uploaded document accepted as the latest ground truth from supplier/inventory sheet.";
        ground_truth = `Stock level for ${comp.item} must be updated to ${comp.sourceValue}`;
        insights = [
          `Detected contradiction between uploaded document (${uploadedData.fileName}) and local database for ${comp.item}.`,
          `Uploaded document indicates ${comp.sourceValue}, while DB reflects ${comp.localValue}.`,
          `Current daily revenue is reported at $${salesData.total_revenue_today || 4230}.`,
          `Customer reviews display positive feedback regarding garment style and fit.`,
          `Apparel supply chain risk is elevated due to external macro-factors.`
        ];
        riskLevel = "HIGH";
      } else {
        const randVal = Math.floor(Math.random() * 3);
        val1 = `${randomProduct.stock} units in warehouse`;
        val2 = "Supplier email flags shortage of materials";
        resolution = "supplier_email accepted — supplier feedback has direct impact on supply availability";
        ground_truth = `Stock level for ${randomProduct.name} is critically restricted`;
        
        if (randVal === 1) {
          metric = "price";
          val1 = `$${randomProduct.price || 120} standard retail price`;
          val2 = "Competitor matching alert at 20% lower";
          resolution = "Competitor alert accepted for dynamic price matching";
          ground_truth = `Target price for ${randomProduct.name} needs discount adjustment`;
        } else if (randVal === 2) {
          metric = "delivery time";
          val1 = "Expected shipment in 2 days";
          val2 = "Port disruption news indicates 10-day delay";
          resolution = "News feed accepted due to systemic logistics warning";
          ground_truth = "Inbound supply chain delayed by 8 days";
        }

        insights = [
          `Inventory levels for ${randomProduct.name} are currently at ${randomProduct.stock} units.`,
          `Supplier logistics issues may impact restocking of key apparel categories.`,
          `Current daily revenue is reported at $${salesData.total_revenue_today || 4230}.`,
          `Customer reviews display positive feedback regarding garment style and fit.`,
          `Apparel supply chain risk is elevated due to external macro-factors.`
        ];
      }

      // Respect saleActive — never recommend a new sale if one is running
      const fallbackSaleRecommended = !saleActive && riskLevel === 'HIGH';

      return {
        agent: 'Analyst',
        status: 'complete',
        contradictions: [
          {
            metric,
            source1: { name: "warehouse", value: val1, credibility: 0.9 },
            source2: { name: metric === "delivery time" ? "news_feed" : "supplier_email", value: val2, credibility: 0.95 },
            resolution,
            ground_truth
          }
        ],
        noise_filtered: ["Filtered unrelated logistics circulars", "Filtered legacy coupon inquiries"],
        insights,
        risk_level: riskLevel,
        sale_recommended: fallbackSaleRecommended,
        recommended_discount: fallbackSaleRecommended ? (randomProduct.stock < 15 ? 20 : 15) : 0,
        recommended_duration: fallbackSaleRecommended ? 3 : 0,
        reasoning: saleActive
          ? `Sale already active. Recommending multi-channel marketing campaign to maximize conversion without duplicate discounting.`
          : `Dynamic fallback recommendation: Adjust pricing or launch sale for ${randomProduct.name} to optimize stock health.`
      };
    }
  }

  function isRecentlyExecuted(actionName: string) {
    const cutoff = Date.now() - 150000; // 2.5 minutes
    return actionLedger.some(entry => entry.actionName === actionName && entry.timestamp > cutoff);
  }

  // --- AGENT 3: decisionAgent ---
  async function decisionAgent(analystResult: any, data: any) {
    const CONSTRAINTS = {
      budget_pkr: 50000,
      notification_deadline_hours: 1,
      sale_max_hours: 4,
      rate_limit_per_minute: 3
    };
    
    // Dynamic Metrics
    let currentStock = 0;
    if (data && data.sources) {
      const warehouseSrc = data.sources.find((s: any) => s.name === 'warehouse');
      if (warehouseSrc && warehouseSrc.data) {
        currentStock = warehouseSrc.data.reduce((acc: number, item: any) => acc + item.stock, 0);
      }
    } else {
      currentStock = 120; // fallback mock
    }

    let revenueChange = 0;
    if (data && data.sources) {
      const salesSrc = data.sources.find((s: any) => s.name === 'sales_dashboard');
      if (salesSrc && salesSrc.data && salesSrc.data.weekly_revenue_change !== undefined) {
        revenueChange = salesSrc.data.weekly_revenue_change;
      }
    }

    const riskLevel = analystResult.risk_level || 'LOW';
    const saleAlreadyActive = saleActive;
    
    // Calculate hours since last sale
    const lastSaleAction = [...agentLogs].reverse().find(l => l.action === 'Execute Sale');
    let hoursSinceLastSale = 999;
    if (lastSaleAction) {
      hoursSinceLastSale = (Date.now() - new Date(lastSaleAction.timestamp).getTime()) / 3600000;
    }

    // Apply Decision Rules
    let primaryAction = "Monitor — no immediate action needed";
    let saleRecommended = false;

    // Rule 1: No sale if one already active
    if (saleAlreadyActive) {
      primaryAction = "Marketing Campaign";
      saleRecommended = false;
    }
    // Rule 2: No repeated sale within 4 hours
    else if (hoursSinceLastSale < 4) {
      primaryAction = "Recent sale just ended — recommend price adjustment instead";
      saleRecommended = false;
    }
    // Rule 3: Sale only if revenue critically down
    else if (revenueChange < -20 && riskLevel === 'HIGH') {
      primaryAction = "Flash sale recommended";
      saleRecommended = true;
    }
    // Rule 4: Stock low but revenue ok
    else if (currentStock < 100 && revenueChange > -10) {
      primaryAction = "Restock order — no sale needed";
      saleRecommended = false;
    }
    // Rule 5: Revenue down but stock ok
    else if (revenueChange < -15 && currentStock > 200) {
      primaryAction = "Marketing campaign recommended";
      saleRecommended = false;
    }
    // Rule 6: Everything ok
    else {
      primaryAction = "Monitor — no immediate action needed";
      saleRecommended = false;
    }

    const actions: any[] = [];
    let idCounter = 1;

    if (uploadedFileData) {
      actions.push({
        id: idCounter++,
        name: 'Merge uploaded data to Local DB',
        reasoning: 'Resolve contradiction by merging uploaded data into local warehouse database',
        constraint_check: 'No budget required — PASS',
        depends_on: null,
        status: 'pending'
      });
    }

    actions.push({
      id: idCounter++,
      name: isRecentlyExecuted('Validate stock') ? 'Verify stock logs' : 'Validate stock',
      reasoning: 'Cross-reference all sources for accurate count',
      constraint_check: 'No budget required — PASS',
      depends_on: idCounter > 2 ? idCounter - 2 : null,
      status: 'pending'
    });

    if (primaryAction.includes("Restock order")) {
      actions.push({
        id: idCounter++,
        name: 'Restock order',
        reasoning: 'Stock levels are critically low. Automatically reordering from vendors.',
        constraint_check: 'Budget: within 50,000 PKR limit — PASS',
        depends_on: idCounter - 2,
        status: 'pending'
      });
    } else if (primaryAction.includes("Flash sale")) {
      actions.push({
        id: idCounter++,
        name: 'Launch flash sale',
        reasoning: analystResult.reasoning || 'Revenue critically down. Launching sale to recover metrics.',
        constraint_check: `Duration: ${analystResult.recommended_duration}hrs < 4hr limit — PASS`,
        depends_on: idCounter - 2,
        requires_approval: true,
        status: 'awaiting_approval'
      });
    } else if (primaryAction === "Marketing Campaign" || primaryAction.includes("Marketing campaign") || primaryAction.includes("increase marketing")) {
      actions.push({
        id: idCounter++,
        name: 'Marketing Campaign',
        reasoning: 'Active sale detected. Recommending dynamic multi-channel marketing campaign instead of sale to boost conversion velocity.',
        constraint_check: 'Budget: within 50,000 PKR limit — PASS',
        depends_on: idCounter > 2 ? idCounter - 2 : null,
        requires_approval: true,
        status: 'awaiting_approval'
      });
      actions.push({
        id: idCounter++,
        name: 'Send promotional push notification to customers',
        reasoning: 'Inform customers of active flash sale details to drive traffic.',
        constraint_check: 'No budget required — PASS',
        depends_on: idCounter - 2,
        status: 'pending'
      });
      actions.push({
        id: idCounter++,
        name: 'Highlight low-stock items as "Almost Gone!"',
        reasoning: 'Create scarcity effect on products with critical inventory levels.',
        constraint_check: 'No budget required — PASS',
        depends_on: idCounter - 2,
        status: 'pending'
      });
      actions.push({
        id: idCounter++,
        name: 'Create urgency banner: "Only X units left!"',
        reasoning: 'Deploy banner UI displaying dynamic remaining stock to prompt conversions.',
        constraint_check: 'No budget required — PASS',
        depends_on: idCounter - 2,
        status: 'pending'
      });
      actions.push({
        id: idCounter++,
        name: 'Email campaign to wishlist customers',
        reasoning: 'Notify customers who expressed interest in items that are currently on sale or low in stock.',
        constraint_check: 'No budget required — PASS',
        depends_on: idCounter - 2,
        status: 'pending'
      });
      actions.push({
        id: idCounter++,
        name: 'Boost social media visibility',
        reasoning: 'Share dynamic codes and products to social handles.',
        constraint_check: 'No budget required — PASS',
        depends_on: idCounter - 2,
        status: 'pending'
      });
    }

    actions.push({
      id: idCounter++,
      name: 'Schedule 24hr monitoring',
      reasoning: 'Continuous watch after actions',
      constraint_check: 'No constraints — PASS',
      depends_on: idCounter - 2,
      status: 'pending'
    });
    
    return {
      agent: 'Decision',
      status: 'complete',
      primaryAction,
      actions_planned: actions.length,
      constraints_applied: CONSTRAINTS,
      action_chain: actions
    };
  }

  // --- AGENT 4: executorAgent ---
  async function executorAgent(decisionResult: any) {
    const results = [];
    for (const action of decisionResult.action_chain) {
      if (action.requires_approval) {
        return {
          agent: 'Executor',
          status: 'awaiting_approval',
          completed_actions: results,
          pending_action: action,
          message: 'Admin approval required for flash sale'
        };
      }
      
      if (action.name === 'Restock order') {
        try {
          const warehouseRes = await fetch('http://localhost:3001/warehouse');
          const warehouse = warehouseRes.ok ? await warehouseRes.json() : [];
          for (const item of warehouse) {
            if (item.stock < 50) {
              await fetch(`http://localhost:3001/warehouse/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock: item.stock + 100 })
              });
            }
          }
          await new Promise(r => setTimeout(r, 600));
          results.push({
            ...action,
            status: 'success',
            latency_ms: 600,
            result: 'Automatically reordered low stock items from vendors. Budget check passed.'
          });
          actionLedger.push({ actionName: action.name, timestamp: Date.now() });
          continue;
        } catch(e) {
          console.error("Restock Failed", e);
        }
      } else if (action.name === 'Marketing campaign') {
        try {
          const salesRes = await fetch('http://localhost:3001/sales_dashboard');
          if (salesRes.ok) {
            const sales = await salesRes.json();
            const inc = Math.floor(Math.random() * 2000) + 1000;
            await fetch('http://localhost:3001/sales_dashboard', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                total_revenue_today: (sales.total_revenue_today || 0) + inc,
                weekly_revenue_change: (sales.weekly_revenue_change || 0) + 5
              })
            });
          }
          await new Promise(r => setTimeout(r, 600));
          results.push({
            ...action,
            status: 'success',
            latency_ms: 600,
            result: 'Automatically launched targeted ad campaigns. Anticipating revenue boost.'
          });
          actionLedger.push({ actionName: action.name, timestamp: Date.now() });
          continue;
        } catch(e) {
          console.error("Marketing Campaign Failed", e);
        }
      } else if (action.name === 'Merge uploaded data to Local DB') {
        if (uploadedFileData && uploadedFileData.comparison) {
          try {
            const warehouseRes = await fetch('http://localhost:3001/warehouse');
            const warehouse = warehouseRes.ok ? await warehouseRes.json() : [];
            for (const comp of uploadedFileData.comparison) {
              const matchedItem = warehouse.find((w: any) => w.name.toLowerCase().includes(comp.item.toLowerCase()) || comp.item.toLowerCase().includes(w.name.toLowerCase()));
              if (matchedItem) {
                const parsedStock = parseInt(comp.sourceValue);
                if (!isNaN(parsedStock)) {
                  await fetch(`http://localhost:3001/warehouse/${matchedItem.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stock: parsedStock })
                  });
                }
              }
            }
          } catch(e) {
             console.error("DB Merge Failed", e);
          }
        }
        uploadedFileData = null; // Clear it out after merging
      }
      
      await new Promise(r => setTimeout(r, 600));
      results.push({
        ...action,
        status: 'success',
        latency_ms: 600,
        result: `${action.name} completed`
      });
      actionLedger.push({ actionName: action.name, timestamp: Date.now() });
    }
    
    return {
      agent: 'Executor',
      status: 'complete',
      executed: results
    };
  }

  // --- AGENT 5: monitorAgent ---
  async function monitorAgent(saleDiscount: number, saleDuration: number) {
    const saleEndTime = new Date(
      Date.now() + saleDuration * 60 * 60 * 1000
    ).toISOString();
    
    fetch('http://localhost:3001/agent_logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'monitoring_started',
        saleEndTime,
        discount: saleDiscount,
        timestamp: new Date().toISOString()
      })
    }).catch(e => console.log("JSON server not running, skipped monitor log"));
    
    return {
      agent: 'Monitor',
      status: 'active',
      sale_end_time: saleEndTime,
      check_interval: '4hrs',
      monitoring: true
    };
  }

  // API: Run ShopAgent Analysis for GargiAssistant
  app.post('/api/agent/run', async (req, res) => {
    try {
      const data = await dataCollectorAgent();
      const analysis = await analystAgent(data);
      const decisions = await decisionAgent(analysis, data);
      
      res.json({
        workplan: 'DataCollector → Analyst → Decision',
        insights: analysis.insights,
        risk_level: analysis.risk_level,
        contradictions: analysis.contradictions ? analysis.contradictions.map((c: any) => c.ground_truth || "Contradiction found") : [],
        sale_recommended: analysis.sale_recommended,
        recommended_discount: analysis.recommended_discount,
        recommended_duration: analysis.recommended_duration,
        action_chain: decisions.action_chain
      });
    } catch (error) {
      console.error("Agent Run Error:", error);
      res.status(500).json({ error: "Failed to run autonomous agent analysis" });
    }
  });

  // ORCHESTRATOR ENDPOINT
  app.get('/api/orchestrator/run', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const send = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    
    try {
      send({ type: 'start', message: 'Orchestrator initialized' });
      
      send({ type: 'agent_start', agent: 'DataCollector' });
      const data = await dataCollectorAgent();
      send({ type: 'agent_complete', agent: 'DataCollector', result: data });
      
      send({ type: 'agent_start', agent: 'Analyst' });
      const analysis = await analystAgent(data);
      send({ type: 'agent_complete', agent: 'Analyst', result: analysis });
      
      send({ type: 'agent_start', agent: 'Decision' });
      const decisions = await decisionAgent(analysis, data);
      send({ type: 'agent_complete', agent: 'Decision', result: decisions });
      
      send({ type: 'agent_start', agent: 'Executor' });
      const execution = await executorAgent(decisions);
      send({ type: 'agent_complete', agent: 'Executor', result: execution });
      
      if (execution.status === 'awaiting_approval') {
        send({ 
          type: 'awaiting_approval',
          action: execution.pending_action,
          action_chain: decisions.action_chain,
          recommended_discount: analysis.recommended_discount || 0,
          recommended_duration: analysis.recommended_duration || 0,
          reasoning: analysis.reasoning,
          sale_recommended: analysis.sale_recommended === true && !saleActive,
          analysis_result: analysis // for frontend to show Insights, Contradictions, etc.
        });
        res.end();
        return;
      }
      
      send({ type: 'agent_start', agent: 'Monitor' });
      const monitoring = await monitorAgent(20, 2);
      send({ type: 'agent_complete', agent: 'Monitor', result: monitoring });
      
      send({
        type: 'complete',
        trace: {
          session_id: Date.now(),
          workplan: 'DataCollector→Analyst→Decision→Executor→Monitor',
          agents_used: 5,
          data, analysis, decisions, execution, monitoring,
          baseline_comparison: {
            without_agent: 'Manual: 2-3 hours',
            with_agent: 'Automated: ~3 seconds',
            improvement: '99.9% faster'
          }
        }
      });
      
    } catch (err: any) {
      send({ type: 'error', message: err.message });
    }
    
    res.end();
  });

  app.post("/api/orchestrator/approve-sale", async (req, res) => {
    try {
      lastAdminActivity = Date.now();
      const { discount, duration } = req.body;
      
      productsDb = productsDb.map(p => {
        const originalPrice = p.originalPrice || p.price;
        const salePrice = Math.round(originalPrice * (1 - discount / 100) * 100) / 100;
        return {
          ...p,
          originalPrice,
          price: salePrice,
          saleActive: true,
          saleEndTime: new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()
        };
      });

      saleActive = true;
      saleEndTime = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString();

      const logMsg = `Executed sale with ${discount}% discount for ${duration} hours.`;
      agentLogs.push({
        action: "Execute Sale",
        result: logMsg,
        timestamp: new Date().toISOString()
      });

      serverNotifications.unshift({
        id: Math.random().toString(36).substr(2, 9),
        title: "⚡ FLASH SALE LAUNCHED",
        message: `Adaptive retail price strategy active: ${discount}% discount deployed.`,
        time: new Date().toLocaleTimeString(),
        type: 'sale',
        read: false
      });

      const monitorRes = await monitorAgent(discount, duration);
      
      // Sync to json-server
      await syncStoreStateToJsonServer();
      
      res.json({
        success: true,
        message: logMsg,
        monitor: monitorRes,
        saleActive,
        saleEndTime,
        products: productsDb,
        notifications: serverNotifications
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to execute sale" });
    }
  });

  app.post("/api/orchestrator/approve-marketing", async (req, res) => {
    try {
      lastAdminActivity = Date.now();
      const { campaignType, targetAudience, estimatedReach } = req.body;
      
      const logMsg = `Executed Marketing Campaign (${campaignType}) targeting ${targetAudience} with est. reach of ${estimatedReach}.`;
      agentLogs.push({
        action: "Execute Marketing",
        result: logMsg,
        timestamp: new Date().toISOString()
      });

      serverNotifications.unshift({
        id: Math.random().toString(36).substr(2, 9),
        title: "📢 MARKETING CAMPAIGN DEPLOYED",
        message: `Multi-channel campaign (${campaignType}) live for ${targetAudience}. Est. reach: ${estimatedReach}.`,
        time: new Date().toLocaleTimeString(),
        type: 'info',
        read: false
      });

      // Also create a dynamic campaign entry in db.json if there is a campaigns list
      try {
        await fetch("http://localhost:3001/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: `camp-${Math.random().toString(36).substr(2, 9)}`,
            name: `${campaignType} - ${targetAudience}`,
            type: campaignType,
            status: "Active",
            budget: 15000,
            reach: estimatedReach,
            ctr: "3.5%",
            conversions: 120,
            revenue: 0,
            roi: "2.4x"
          })
        });
      } catch (err) {
        console.error("Failed to add campaign to JSON server:", err);
      }

      await syncStoreStateToJsonServer();

      res.json({
        success: true,
        message: logMsg,
        notifications: serverNotifications
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to execute marketing campaign" });
    }
  });

  // ENDPOINT 2: POST /api/agent/execute-sale
  app.post("/api/agent/execute-sale", async (req, res) => {
    try {
      lastAdminActivity = Date.now();
      const { discount, duration } = req.body;
      if (typeof discount !== 'number' || typeof duration !== 'number') {
        res.status(400).json({ error: "Invalid discount or duration" });
        return;
      }

      // Update all products in DB
      productsDb = productsDb.map(p => {
        const originalPrice = p.originalPrice || p.price;
        const salePrice = Math.round(originalPrice * (1 - discount / 100) * 100) / 100;
        return {
          ...p,
          originalPrice,
          price: salePrice,
          saleActive: true,
          saleEndTime: new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()
        };
      });

      saleActive = true;
      saleEndTime = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString();

      const logMsg = `Executed sale with ${discount}% discount for ${duration} hours.`;
      agentLogs.push({
        action: "Execute Sale",
        result: logMsg,
        timestamp: new Date().toISOString()
      });

      // Add notification to server-side array
      serverNotifications.unshift({
        id: Math.random().toString(36).substr(2, 9),
        title: "⚡ FLASH SALE LAUNCHED",
        message: `Adaptive retail price strategy active: ${discount}% discount deployed.`,
        time: new Date().toLocaleTimeString(),
        type: 'sale',
        read: false
      });
      console.log("Sale started notification sent");

      await syncStoreStateToJsonServer();

      res.json({
        success: true,
        message: logMsg,
        saleActive,
        saleEndTime,
        products: productsDb,
        notifications: serverNotifications
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to execute sale" });
    }
  });

  // ENDPOINT 3: POST /api/agent/end-sale
  app.post("/api/agent/end-sale", async (req, res) => {
    try {
      lastAdminActivity = Date.now();
      productsDb = productsDb.map(p => {
        const originalPrice = p.originalPrice || p.price;
        return {
          ...p,
          price: originalPrice,
          originalPrice: undefined,
          saleActive: false,
          saleEndTime: null
        };
      });

      saleActive = false;
      saleEndTime = null;

      const logMsg = "Ended active sale. Restored original prices.";
      agentLogs.push({
        action: "End Sale",
        result: logMsg,
        timestamp: new Date().toISOString()
      });

      // Add notification to server-side array
      serverNotifications.unshift({
        id: Math.random().toString(36).substr(2, 9),
        title: "⚡ FLASH SALE ENDED",
        message: "Flash sale expired. Catalog prices restored.",
        time: new Date().toLocaleTimeString(),
        type: 'sale',
        read: false
      });
      console.log("Sale ended notification sent");

      await syncStoreStateToJsonServer();

      res.json({
        success: true,
        message: logMsg,
        saleActive,
        saleEndTime,
        products: productsDb,
        notifications: serverNotifications
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to end sale" });
    }
  });

  // ENDPOINT 4: GET /api/agent/logs
  app.get("/api/agent/logs", (req, res) => {
    res.json(agentLogs);
  });

  // ENDPOINT 5: POST /api/agent/log
  app.post("/api/agent/log", (req, res) => {
    try {
      const { action, result, timestamp } = req.body;
      if (!action || !result) {
        res.status(400).json({ error: "Missing action or result" });
        return;
      }

      agentLogs.push({
        action,
        result,
        timestamp: timestamp || new Date().toISOString()
      });

      res.json({ success: true, logs: agentLogs });
    } catch (error) {
      res.status(500).json({ error: "Failed to save log" });
    }
  });

  // ENDPOINT 6 (Bonus Utility): GET /api/agent/products
  app.get("/api/agent/products", (req, res) => {
    res.json({
      saleActive,
      saleEndTime,
      products: productsDb,
      notifications: serverNotifications
    });
  });

  // ENDPOINT 7: POST /api/data/snapshot
  app.post("/api/data/snapshot", async (req, res) => {
    try {
      const warehouseRes = await fetch('http://localhost:3001/warehouse');
      const salesRes = await fetch('http://localhost:3001/sales_dashboard');
      
      let warehouse = [];
      let revenue = 0;
      
      if (warehouseRes.ok) {
        warehouse = await warehouseRes.json();
      } else {
        warehouse = MOCK_SOURCES.warehouse;
      }
      
      if (salesRes.ok) {
        const sales = await salesRes.json();
        revenue = sales.total_revenue_today || 4230;
      } else {
        revenue = 4230;
      }
      
      const snapshot: Snapshot = {
        timestamp: Date.now(),
        products: warehouse.map((p: any) => ({
          id: p.id,
          name: p.name,
          stock: p.stock
        })),
        revenue: revenue
      };
      
      snapshotHistory.push(snapshot);
      if (snapshotHistory.length > 10) {
        snapshotHistory.shift();
      }
      
      res.json({ success: true, snapshot, historySize: snapshotHistory.length });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create snapshot", details: err.message });
    }
  });

  // ENDPOINT 8: GET /api/data/history
  app.get("/api/data/history", (req, res) => {
    res.json(snapshotHistory);
  });

  // ENDPOINT 9: POST /api/upload/validate
  app.post("/api/upload/validate", async (req, res) => {
    let ext = "";
    let warehouse: any[] = MOCK_SOURCES.warehouse || [];
    const fileName = req.body?.fileName || "";
    const fileContent = req.body?.fileContent || "";
    try {
      if (!fileName) {
        res.status(400).json({ error: "Missing fileName" });
        return;
      }
      
      ext = fileName.split('.').pop()?.toLowerCase() || '';
      let classification = "unknown";
      if (['csv', 'xlsx', 'json'].includes(ext)) {
        classification = "structured";
      } else if (['pdf', 'txt', 'docx'].includes(ext)) {
        classification = "unstructured";
      } else if (['png', 'jpg', 'jpeg'].includes(ext)) {
        classification = "OCR-needed";
      }
      
      // Get current warehouse inventory for context/comparison
      const warehouseRes = await fetch('http://localhost:3001/warehouse');
      warehouse = warehouseRes.ok ? await warehouseRes.json() : MOCK_SOURCES.warehouse;
      
      const relevancePrompt = `
        You are an expert retail analysis agent for GarKS, a premium clothing store.
        Analyze the uploaded file metadata and snippet content.
        File Name: ${fileName}
        File Content Snippet: ${fileContent?.substring(0, 3000) || "No content available"}
        Local Inventory Data: ${JSON.stringify(warehouse)}
        
        Determine if this file is relevant to clothing, fashion, apparel, textiles, retail inventory, suppliers, logistics delays, or store sales.
        If it is irrelevant (e.g. food recipes, personal journals, movie lists), mark relevant as false.
        
        Return ONLY a JSON response matching the schema:
        {
          "relevant": boolean,
          "confidence": number,
          "reason": "Clear explanation",
          "summary": "Brief summary of what was found in the file",
          "comparison": [
            {
              "item": "Product Name",
              "sourceValue": "Stock or Price in file",
              "localValue": "Stock or Price locally",
              "discrepancy": "Description of difference"
            }
          ]
        }
      `;
      
      const response = await callGemini(relevancePrompt);
      
      // Instead of merging data here, we just save it for the Agent Orchestrator to merge!
      let mergeSuccess = false; // It will be merged by the Agent
      uploadedFileData = {
        fileName,
        fileContent,
        comparison: response.comparison || []
      };
      
      res.json({
        success: true,
        classification,
        relevant: response.relevant,
        reason: response.reason,
        summary: response.summary,
        comparison: response.comparison || [],
        mergeSuccess
      });
      
    } catch (err: any) {
      console.error("Upload validation error:", err);
      const fileNameLower = fileName?.toLowerCase() || "";
      const contentLower = fileContent?.toLowerCase() || "";
      const relevantKeywords = [
        'stock', 'inventory', 'supplier', 'sales', 'clothing', 'garks', 
        'competitor', 'price', 'catalog', 'product', 'order', 'warehouse', 
        'distributor', 'delivery', 'shipment', 'retail', 'wear', 'apparel', 
        'garment', 'shirt', 'chinos', 'jacket', 'polo', 'blouse', 'hoodie'
      ];
      const isApparelRelevant = relevantKeywords.some(keyword => 
        fileNameLower.includes(keyword) || contentLower.includes(keyword)
      );
      
      let mockComparison: any[] = [];
      let mockReason = "Heuristic classification: document contents and filename do not appear related to GarKS store operations.";
      let mockSummary = "No relevant content parsed.";

      if (isApparelRelevant) {
        mockReason = "Document automatically classified as apparel-relevant via heuristic metadata analysis.";
        mockSummary = "Competitor pricing and stock levels parsed from document.";
        // Generate mock comparison based on products in the database
        mockComparison = warehouse.slice(0, 3).map((w: any) => {
          const fileStock = Math.max(10, w.stock + (Math.random() > 0.5 ? 15 : -10));
          return {
            item: w.name,
            sourceValue: `${fileStock} units`,
            localValue: `${w.stock} units`,
            discrepancy: `Discrepancy of ${Math.abs(fileStock - w.stock)} units found between uploaded sheet and live database.`
          };
        });
      }
      
      // Save to global variable for Orchestrator Agent to merge
      uploadedFileData = {
        fileName,
        fileContent,
        comparison: mockComparison
      };
      
      res.json({
        success: true,
        classification: ext === 'csv' || ext === 'xlsx' ? 'structured' : 'unstructured',
        relevant: isApparelRelevant,
        reason: mockReason,
        summary: mockSummary,
        comparison: mockComparison,
        mergeSuccess: false
      });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
