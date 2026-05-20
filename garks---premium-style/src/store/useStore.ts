import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sendSaleEndEmail } from '../services/emailService';

export type Review = {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  stock: number;
  variants: { size: string[]; color: string[]; material?: string[] };
  rating: number;
  stockHistory?: { date: string; amount: number; type: 'in' | 'out' }[];
  sku?: string;
  reviews?: Review[];
  onSale?: boolean;
  originalPrice?: number;
  discountPercent?: number;
};

export type Supplier = {
  id: string;
  name: string;
  company: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  category: string; // Fabric, Leather, Accessories, etc.
  rating: number; // 1-5 Performance Rating
};

export type PurchaseOrder = {
  id: string;
  supplierId: string;
  productId: string;
  quantity: number;
  status: 'Draft' | 'Sent' | 'Received' | 'Completed';
  createdAt: string;
  totalCost: number;
};

export type CartItem = Product & { quantity: number };

export type User = {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  photo?: string;
  points: number;
  tier: 'Silver' | 'Gold' | 'Platinum';
};

export type Order = {
  id: string;
  items: CartItem[];
  total: number;
  status: 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered';
  date: string;
  trackingNumber: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'sale' | 'info' | 'order' | 'inventory';
  read: boolean;
};

export type Campaign = {
  id: string;
  name: string;
  status: 'Active' | 'Draft' | 'Paused';
  reach: string;
  ctr: string;
  icon: string;
  color: string;
  type: 'Instagram' | 'Email' | 'SMS' | 'Web';
};

export type Theme = 'dark' | 'light' | 'premium-gold';

export type AppState = {
  user: User | null;
  mode: 'customer' | 'admin';
  theme: Theme;
  cart: CartItem[];
  wishlist: string[]; // Product IDs
  inventory: Product[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  orders: Order[];
  notifications: Notification[];
  campaigns: Campaign[];
  isLoggedIn: boolean;
  isLocked: boolean;
  adminPassword: string;
  adminSecurityCode: string;
  gargiOpen: boolean;
  toast: { message: string; visible: boolean } | null;
  cartFeedback: string | null; // ID of product added to cart
  flyPos: { x: number; y: number } | null;
  lastViewed: string[]; // To track recently viewed items for recommendations
  saleActive: boolean;
  saleEndTime: string | null;
  saleDiscount: number;
  agentLogs: string[];
  agentRunning: boolean;
  lastAgentResult: any | null;
  stockoutRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  kpiRevenue: number;
  kpiOrders: number;
  kpiCustomers: number;
  kpiAOV: number;
  orderedCategories: string[];
  revenueDecreasingMode: boolean;
  revenueLostCounter: number;
  ticksCount: number;
  saleRecommendedByAI: boolean;
  saleBannerDismissed: boolean;
  notificationsMuted: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setMode: (mode: 'customer' | 'admin') => void;
  setTheme: (theme: Theme) => void;
  addToCart: (product: Product, event?: any) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  toggleWishlist: (productId: string) => void;
  clearCart: () => void;
  placeOrder: (total: number) => void;
  logout: () => void;
  updateInventory: (product: Product) => void;
  addNotification: (notif: Omit<Notification, 'id' | 'time' | 'read'>) => void;
  markNotificationsRead: () => void;
  clearNotifications: () => void;
  setToast: (message: string | null) => void;
  trackView: (productId: string) => void;
  setGargiOpen: (open: boolean) => void;
  addCampaign: (campaign: Campaign) => void;
  toggleMuteNotifications: () => void;
  
  setAdminPassword: (password: string) => void;
  setAdminSecurityCode: (code: string) => void;
  unlockAdmin: (password: string) => boolean;
  lockAdmin: () => void;
  
  // Inventory & Supplier Actions
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (supplier: Supplier) => void;
  addPurchaseOrder: (po: PurchaseOrder) => void;
  updatePurchaseOrder: (po: PurchaseOrder) => void;
  fetchProducts: () => Promise<void>;
  endSale: () => Promise<void>;
  launchSale: (discount: number, durationHours: number) => void;
  setAgentResult: (result: any) => void;
  addAgentLog: (log: string) => void;
  setAgentRunning: (running: boolean) => void;
  livelyUpdateMetrics: () => void;
  orderRestock: (category: string) => void;
  cancelRestock: (category: string) => void;
  orderSupplierRestock: (productId: string, amount: number, vendorId: string, isAiAutomated: boolean) => void;
  setSaleBannerDismissed: (dismissed: boolean) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
};

const INITIAL_SUPPLIERS: Supplier[] = [
  // Fabric Suppliers
  { id: 's1', name: 'Marco Rossi', company: 'Milan Fabrics Co.', contactPerson: 'Marco', phone: '+39 02 123456', email: 'marco@milanfabrics.it', address: 'Via Montenapoleone, Milan', category: 'Fabric', rating: 4.8 },
  { id: 's4', name: 'Ahmed Khan', company: 'Indus Textiles', contactPerson: 'Ahmed', phone: '+92 21 3456789', email: 'ahmed@industext.com', address: 'SITE Area, Karachi', category: 'Fabric', rating: 4.6 },
  
  // Leather Suppliers
  { id: 's2', name: 'John Smith', company: 'Premium Leather Ltd.', contactPerson: 'John', phone: '+44 20 7946 0000', email: 'john@premiumleather.co.uk', address: 'Leather Lane, London', category: 'Leather', rating: 4.5 },
  { id: 's5', name: 'Enzo Ferrari', company: 'Tuscan Leather S.p.A', contactPerson: 'Enzo', phone: '+39 055 987654', email: 'enzo@tuscanleather.it', address: 'Via di Scandicci, Florence', category: 'Leather', rating: 4.9 },
  
  // Accessories Suppliers
  { id: 's3', name: 'Li Wei', company: 'Zhejiang Accessories', contactPerson: 'Li', phone: '+86 571 8888 8888', email: 'li.wei@zjacce.com', address: 'Industrial Road, Hangzhou', category: 'Accessories', rating: 4.2 },
  { id: 's6', name: 'Yuta Watanabe', company: 'Tokyo Trim & Zipper', contactPerson: 'Yuta', phone: '+81 3 1234 5678', email: 'y.watanabe@tokyotrim.jp', address: 'Chuo City, Tokyo', category: 'Accessories', rating: 4.7 }
];

const DUMMY_POS: PurchaseOrder[] = [
  { id: 'PO-001', supplierId: 's1', productId: 'm1', quantity: 100, status: 'Completed', createdAt: '2024-03-10', totalCost: 4500 },
  { id: 'PO-002', supplierId: 's2', productId: 'm3', quantity: 20, status: 'Sent', createdAt: '2024-03-15', totalCost: 3800 }
];

const DUMMY_PRODUCTS: Product[] = [
  // Men's Collection
  { 
    id: 'm1', 
    sku: 'SH-OX-001', 
    name: 'Premium Oxford Shirt', 
    category: 'Shirts', 
    price: 85, 
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80', 
    description: 'Handcrafted from fine Egyptian cotton. Features a semi-spread collar and reinforced seams for a sharp, executive silhouette.', 
    stock: 24, 
    variants: { size: ['S', 'M', 'L', 'XL'], color: ['White', 'Light Blue'], material: ['Cotton'] }, 
    rating: 4.8,
    reviews: [
      { id: 'r1', user: 'Alexander V.', rating: 5, comment: "The quality of this cotton is unmatched. Perfect for long board meetings.", date: '2 days ago' },
      { id: 'r2', user: 'James L.', rating: 4, comment: "Excellent fit, though I'd recommend sizing up if you prefer a relaxed look.", date: '1 week ago' },
      { id: 'r19', user: 'Saeed K.', rating: 5, comment: "Truly a luxury staple. The light blue is stunning in person.", date: '1 month ago' }
    ]
  },
  { 
    id: 'm2', 
    sku: 'PN-CH-002', 
    name: 'Slim Fit Chinos', 
    category: 'Pants', 
    price: 75, 
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80', 
    description: 'Perfect balance of comfort and style. Engineered with a slight stretch for the modern professional on the move.', 
    stock: 35, 
    variants: { size: ['30', '32', '34'], color: ['Khaki', 'Navy'], material: ['Cotton Twill'] }, 
    rating: 4.6,
    reviews: [
      { id: 'r3', user: 'Robert D.', rating: 5, comment: "The comfort level is insane. I wear these both to the office and for casual dinners.", date: '3 days ago' },
      { id: 'r4', user: 'Mark T.', rating: 4, comment: "Great material, holds its shape well after multiple washes.", date: '2 weeks ago' }
    ]
  },
  { 
    id: 'm3', 
    sku: 'JK-LE-003', 
    name: 'Biker Leather Jacket', 
    category: 'Leather Jackets', 
    price: 295, 
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80', 
    description: 'Grained leather with metallic hardware. A bold statement piece designed to age beautifully over time.', 
    stock: 8, 
    variants: { size: ['M', 'L', 'XL'], color: ['Black'], material: ['Lambskin Leather'] }, 
    rating: 4.9,
    reviews: [
      { id: 'r5', user: 'Viktor R.', rating: 5, comment: "A masterpiece. The leather is buttery soft but feels incredibly durable.", date: 'Yesterday' },
      { id: 'r6', user: 'Chris P.', rating: 5, comment: "Every biker enthusiast needs this. The hardware is high-grade and doesn't rattle.", date: '1 month ago' },
      { id: 'r20', user: 'GarKS Fan', rating: 5, comment: "The smell of premium leather is unmistakable. Simply elite.", date: '2 months ago' }
    ]
  },
  { 
    id: 'm4', 
    sku: 'HD-FL-004', 
    name: 'Tech Fleece Hoodie', 
    category: 'Hoodies', 
    price: 95, 
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80', 
    description: 'Advanced warmth without the weight. Features moisture-wicking technology and a sleek, technical finish.', 
    stock: 42, 
    variants: { size: ['S', 'M', 'L'], color: ['Grey', 'Black'], material: ['Tech Fleece'] }, 
    rating: 4.7,
    reviews: [
      { id: 'r7', user: 'Leo S.', rating: 5, comment: "Doesn't even feel like a hoodie. It feels like a piece of high-performance gear.", date: '4 days ago' },
      { id: 'r8', user: 'Daniel M.', rating: 4, comment: "Great for early morning runs. The hood stays in place perfectly.", date: '3 weeks ago' }
    ]
  },
  { 
    id: 'm5', 
    sku: 'PL-PI-005', 
    name: 'Classic Pique Polo', 
    category: 'Polo Shirts', 
    price: 55, 
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80', 
    description: 'Breathable cotton pique fabric. A timeless silhouette for the refined casual wardrobe.', 
    stock: 5, 
    variants: { size: ['S', 'M', 'L', 'XL'], color: ['Navy', 'White', 'Black'], material: ['Cotton Pique'] }, 
    rating: 4.5,
    reviews: [
      { id: 'r9', user: 'Sebastian W.', rating: 5, comment: "The collar doesn't curl, which is a sign of true quality polo.", date: '5 days ago' },
      { id: 'r10', user: 'Thomas E.', rating: 4, comment: "Nice traditional fit. Would love more pastel colors in the future.", date: '1 month ago' }
    ]
  },
  
  // Women's Collection
  { 
    id: 'w1', 
    sku: 'BL-SI-006', 
    name: 'Silk Blouse', 
    category: 'Women', 
    price: 120, 
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80', 
    description: 'Smooth silk for an elegant drape. Designed to capture light and exude effortless sophisticated charm.', 
    stock: 15, 
    variants: { size: ['XS', 'S', 'M'], color: ['Ivory', 'Champagne'], material: ['100% Silk'] }, 
    rating: 4.9,
    reviews: [
      { id: 'r11', user: 'Elena G.', rating: 5, comment: "The way this silk falls is just ethereal. I feel incredibly confident wearing it.", date: '1 week ago' },
      { id: 'r12', user: 'Sarah J.', rating: 5, comment: "Pure luxury. Worth every penny for the quality alone.", date: '2 weeks ago' },
      { id: 'r21', user: 'Isabella M.', rating: 4, comment: "Beautiful ivory shade. It's delicate but well-constructed.", date: '1 month ago' }
    ]
  },
  { 
    id: 'w2', 
    sku: 'TR-HW-007', 
    name: 'High-Waist Trousers', 
    category: 'Women', 
    price: 90, 
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80', 
    description: 'Tailored fit for professional presence. High-waisted silhouette that elongates and empowers.', 
    stock: 20, 
    variants: { size: ['2', '4', '6', '8'], color: ['Black', 'Tan'], material: ['Wool Blend'] }, 
    rating: 4.7,
    reviews: [
      { id: 'r13', user: 'Natasha K.', rating: 5, comment: "Finally, trousers that fit perfectly at the waist and hip. Executive chic.", date: '10 days ago' },
      { id: 'r14', user: 'Fiona H.', rating: 4, comment: "Lovely wool blend. Warm but breathable for indoor use.", date: '3 weeks ago' }
    ]
  },
  { 
    id: 'w3', 
    sku: 'CT-TR-008', 
    name: 'Oversized Trench Coat', 
    category: 'Women', 
    price: 185, 
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80', 
    description: 'Water-resistant luxury trench. A modern reinterpretion of a classic, providing style in any element.', 
    stock: 12, 
    variants: { size: ['S', 'M', 'L'], color: ['Camel'], material: ['Gabardine'] }, 
    rating: 4.8,
    reviews: [
      { id: 'r15', user: 'Catherine B.', rating: 5, comment: "The ultimate power move. This trench turns heads in London rain.", date: 'Yesterday' },
      { id: 'r16', user: 'Lydia W.', rating: 5, comment: "Incredible detail on the belt and buckles. Truly high fashion.", date: '1 month ago' }
    ]
  },
  { 
    id: 'w4', 
    sku: 'SW-CS-009', 
    name: 'Cashmere Sweater', 
    category: 'Women', 
    price: 210, 
    image: 'https://images.unsplash.com/photo-1574167132742-132ba067ced5?auto=format&fit=crop&q=80', 
    description: '100% pure Himalayan cashmere. Unrivaled softness and warmth for the discerning individual.', 
    stock: 0, 
    variants: { size: ['S', 'M'], color: ['Soft Grey', 'Dusty Rose'], material: ['Cashmere'] }, 
    rating: 5.0,
    reviews: [
      { id: 'r17', user: 'Sofia L.', rating: 5, comment: "It feels like a warm hug from a cloud. My desert island item.", date: '2 days ago' },
      { id: 'r18', user: 'Maya P.', rating: 5, comment: "Pure, unadulterated luxury. I'll be ordering the rose one as soon as it's back in stock.", date: '1 week ago' }
    ]
  },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  user: null,
  mode: 'customer',
  theme: 'dark',
  cart: [],
  wishlist: [],
  inventory: DUMMY_PRODUCTS,
  suppliers: INITIAL_SUPPLIERS,
  purchaseOrders: DUMMY_POS,
  orders: [],
  notifications: [
    { id: 'initial-1', title: 'Welcome to GarKS', message: 'Experience the future of fashion with Gargi AI.', time: '1h ago', type: 'info', read: false }
  ],
  campaigns: [
    { id: 'c1', name: 'Summer Solstice', status: 'Active', reach: '12.4k', ctr: '4.2%', icon: 'Instagram', color: '#ec4899', type: 'Instagram' },
    { id: 'c2', name: 'VIP Privilege', status: 'Active', reach: '2.1k', ctr: '12.8%', icon: 'Mail', color: '#3fb950', type: 'Email' },
    { id: 'c3', name: 'Flash Friday', status: 'Draft', reach: '0', ctr: '0%', icon: 'Zap', color: '#fbbf24', type: 'SMS' },
  ],
  isLoggedIn: false,
  isLocked: false,
  adminPassword: 'hehehahahoho',
  adminSecurityCode: '1234567890',
  gargiOpen: false,
  toast: null,
  cartFeedback: null,
  flyPos: null,
  lastViewed: [],
  saleActive: false,
  saleEndTime: null,
  saleDiscount: 0,
  agentLogs: [],
  agentRunning: false,
  lastAgentResult: null,
  stockoutRisk: 'LOW',
  kpiRevenue: 45231,
  kpiOrders: 1284,
  kpiCustomers: 10902,
  kpiAOV: 124.5,
  orderedCategories: [],
  revenueDecreasingMode: false,
  revenueLostCounter: 0,
  ticksCount: 0,
  saleRecommendedByAI: false,
  saleBannerDismissed: false,
  notificationsMuted: false,

  setUser: (user) => set({ user, isLoggedIn: !!user }),
  setMode: (mode) => set({ mode }),
  setTheme: (theme) => set({ theme }),
  
  addToCart: (product, event) => {
    set((state) => {
      const existing = state.cart.find((item) => item.id === product.id);
      
      if (event) {
        set({ flyPos: { x: event.clientX, y: event.clientY } });
        setTimeout(() => set({ flyPos: null }), 600);
      }

      // Feedback mechanism
      setTimeout(() => set({ cartFeedback: null }), 1000);
      
      const newCart = existing 
        ? state.cart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...state.cart, { ...product, quantity: 1 }];

      return { 
        cart: newCart,
        cartFeedback: product.id,
        toast: { message: `Added ${product.name} to cart`, visible: true }
      };
    });
    
    // Auto clear toast
    setTimeout(() => set({ toast: null }), 3000);
  },

  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter((item) => item.id !== productId),
  })),

  updateCartQuantity: (productId, quantity) => set((state) => ({
    cart: state.cart.map((item) =>
      item.id === productId ? { ...item, quantity: Math.max(0, quantity) } : item
    ).filter(item => item.quantity > 0),
  })),

  toggleWishlist: (productId) => set((state) => ({
    wishlist: state.wishlist.includes(productId) 
      ? state.wishlist.filter(id => id !== productId)
      : [...state.wishlist, productId]
  })),

  clearCart: () => set({ cart: [] }),

  placeOrder: (total) => {
    set((state) => {
      const newOrder: Order = {
        id: `ORD-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`,
        items: [...state.cart],
        total: total,
        status: 'Processing',
        date: new Date().toISOString(),
        trackingNumber: `GS-${Math.random().toString(36).substring(7).toUpperCase()}`
      };
      
      // Award points
      const pointsEarned = Math.floor(total * 0.5);
      const updatedUser = state.user ? {
        ...state.user,
        points: state.user.points + pointsEarned,
        tier: (state.user.points + pointsEarned) > 2000 ? 'Platinum' : (state.user.points + pointsEarned) > 1000 ? 'Gold' : 'Silver'
      } as User : null;

      return {
        orders: [newOrder, ...state.orders],
        cart: [],
        user: updatedUser,
        toast: { message: "Order placed successfully!", visible: true }
      };
    });
    setTimeout(() => {
      useStore.setState({ toast: null });
    }, 5000);
  },
  
  logout: () => set({ user: null, isLoggedIn: false, cart: [], wishlist: [], mode: 'customer', notifications: [], toast: null, cartFeedback: null, orders: [] }),

  updateInventory: (product) => set((state) => ({
    inventory: state.inventory.map((p) => p.id === product.id ? product : p),
  })),

  addNotification: (notif) => {
    set((state) => {
      const newNotif = {
        ...notif,
        id: Math.random().toString(36).substr(2, 9),
        time: 'Just now',
        read: false
      };
      return {
        notifications: [newNotif, ...state.notifications],
        toast: { message: `${newNotif.title} - ${newNotif.message}`, visible: true }
      };
    });
    // Auto-clear notification toast after 5s
    setTimeout(() => {
      useStore.setState(s => ({ toast: null }));
    }, 5000);
  },

  markNotificationsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),

  clearNotifications: () => set({ notifications: [] }),
  setToast: (message) => {
    if (message) {
      set({ toast: { message, visible: true } });
      setTimeout(() => {
        set((state) => ({ 
          toast: state.toast?.message === message ? null : state.toast 
        }));
      }, 3000);
    } else {
      set({ toast: null });
    }
  },

  trackView: (productId) => set((state) => ({
    lastViewed: [productId, ...state.lastViewed.filter(id => id !== productId)].slice(0, 10)
  })),

  setGargiOpen: (open) => set({ gargiOpen: open }),
  addCampaign: (campaign) => set((state) => ({ campaigns: [campaign, ...state.campaigns] })),
  toggleMuteNotifications: () => set((state) => ({ notificationsMuted: !state.notificationsMuted })),

  setAdminPassword: (password) => set({ adminPassword: password }),
  setAdminSecurityCode: (code) => set({ adminSecurityCode: code }),
  unlockAdmin: (password) => {
    set({ isLocked: false });
    return true;
  },
  lockAdmin: () => set({ isLocked: true }),

  addSupplier: (supplier) => set((state) => ({ suppliers: [...state.suppliers, supplier] })),
  updateSupplier: (supplier) => set((state) => ({
    suppliers: state.suppliers.map(s => s.id === supplier.id ? supplier : s)
  })),
  addPurchaseOrder: (po) => set((state) => ({ purchaseOrders: [...state.purchaseOrders, po] })),
  updatePurchaseOrder: (po) => set((state) => ({
    purchaseOrders: state.purchaseOrders.map(p => p.id === po.id ? po : p)
  })),

  fetchProducts: async () => {
    try {
      const res = await fetch('/api/agent/products');
      if (res.ok) {
        const data = await res.json();
        set((state) => {
          const updatedInventory = state.inventory.map(localProd => {
            const dbProd = data.products.find((p: any) => p.id === localProd.id);
            if (dbProd) {
              const hasPriceDrop = dbProd.originalPrice && dbProd.price < dbProd.originalPrice;
              return {
                ...localProd,
                price: dbProd.price,
                originalPrice: dbProd.originalPrice,
                onSale: dbProd.saleActive || hasPriceDrop || false,
                discountPercent: dbProd.originalPrice ? Math.round(((dbProd.originalPrice - dbProd.price) / dbProd.originalPrice) * 100) : 0
              };
            }
            return localProd;
          });

          let saleDiscount = 0;
          if (data.saleActive && data.products.length > 0) {
            const sampleProd = data.products.find((p: any) => p.originalPrice && p.price < p.originalPrice);
            if (sampleProd) {
              saleDiscount = Math.round(((sampleProd.originalPrice - sampleProd.price) / sampleProd.originalPrice) * 100);
            } else {
              saleDiscount = 20;
            }
          }

          // Merge incoming notifications with local, filtering duplicates by id
          const incomingNotifs = data.notifications || [];
          const existingNotifs = get().notifications || [];
          const mergedNotifs = [...incomingNotifs];
          existingNotifs.forEach((n: any) => {
            if (!mergedNotifs.some(mn => mn.id === n.id)) {
              mergedNotifs.push(n);
            }
          });

          return {
            inventory: updatedInventory,
            saleActive: data.saleActive,
            saleEndTime: data.saleEndTime,
            saleDiscount: saleDiscount || 20,
            notifications: mergedNotifs
          };
        });
      }
    } catch (err) {
      console.error("Failed to sync backend products:", err);
    }
  },

  endSale: async () => {
    // Save discount before state change to pass to email
    const currentDiscount = get().saleDiscount;

    // 1. Instantly apply local restoration for optimistic updates and UI responsiveness
    set((state) => {
      const updatedInventory = state.inventory.map(prod => {
        if (prod.originalPrice) {
          return {
            ...prod,
            price: prod.originalPrice,
            originalPrice: undefined,
            onSale: false,
            discountPercent: 0
          };
        }
        return prod;
      });
      const logMsg = `[${new Date().toLocaleTimeString()}] Flash sale ended. Original prices restored.`;
      
      const newNotification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        title: "⚡ FLASH SALE ENDED",
        message: "Flash sale expired. Catalog prices restored.",
        time: 'Just now',
        type: 'sale',
        read: false
      };

      return {
        saleActive: false,
        saleDiscount: 0,
        saleEndTime: null,
        inventory: updatedInventory,
        agentLogs: [...state.agentLogs, logMsg],
        notifications: [newNotification, ...state.notifications]
      };
    });

    // 2. Sync with backend API
    try {
      await fetch('/api/agent/end-sale', { method: 'POST' });
    } catch (err) {
      console.error("Failed to notify backend of endSale:", err);
    }

    // 3. Trigger manual end email notification
    try {
      await sendSaleEndEmail(currentDiscount, 0);
    } catch (err) {
      console.error("Failed to send sale end email:", err);
    }
  },

  launchSale: (discount, durationHours) => {
    set((state) => {
      const endTime = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
      const updatedInventory = state.inventory.map(prod => {
        const originalPrice = prod.originalPrice || prod.price;
        const discountFactor = (100 - discount) / 100;
        const newPrice = Math.round(originalPrice * discountFactor * 100) / 100;
        return {
          ...prod,
          originalPrice,
          price: newPrice,
          onSale: true,
          discountPercent: discount
        };
      });
      const logMsg = `[${new Date().toLocaleTimeString()}] Flash sale of ${discount}% launched for ${durationHours}h.`;
      
      const newNotification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        title: "⚡ FLASH SALE LAUNCHED",
        message: `Adaptive retail price strategy active: ${discount}% discount deployed.`,
        time: 'Just now',
        type: 'sale',
        read: false
      };

      return {
        saleActive: true,
        saleDiscount: discount,
        saleEndTime: endTime,
        inventory: updatedInventory,
        agentLogs: [...state.agentLogs, logMsg],
        notifications: [newNotification, ...state.notifications],
        revenueDecreasingMode: false,
        revenueLostCounter: 0,
        saleRecommendedByAI: false,
        saleBannerDismissed: false,
        ticksCount: 0
      };
    });
  },

  setAgentResult: (result) => {
    set((state) => {
      const risk = result.risk_level || result.stockoutRisk || 'LOW';
      return {
        lastAgentResult: result,
        stockoutRisk: risk
      };
    });
  },

  addAgentLog: (log) => {
    set((state) => {
      const logMsg = `[${new Date().toLocaleTimeString()}] ${log}`;
      return {
        agentLogs: [...state.agentLogs, logMsg]
      };
    });
  },

  setAgentRunning: (running) => set({ agentRunning: running }),

  livelyUpdateMetrics: () => {
    set((state) => {
      const currentTicks = state.ticksCount + 1;
      let nextRevenueMode = state.revenueDecreasingMode;
      let nextLogs = [...state.agentLogs];

      // Trigger revenue drop simulation if no sale active after 3 ticks
      if (currentTicks >= 3 && !state.saleActive && !state.revenueDecreasingMode) {
        nextRevenueMode = true;
        const systemAlert = `Logistics bottleneck on highway N-55 Indus route is causing visitor conversion and traffic to fall. Revenue decline sequence active.`;
        nextLogs.push(`[${new Date().toLocaleTimeString()}] [SYSTEM ALERT] ${systemAlert}`);
      }

      let revAdd = 0;
      let nextRevenueLost = state.revenueLostCounter;
      let nextSaleRecommended = state.saleRecommendedByAI;
      let nextNotifications = [...state.notifications];
      let nextPurchaseOrders = [...state.purchaseOrders];

      if (nextRevenueMode && !state.saleActive) {
        // Repeatedly decrease revenue by 10 to 30
        const revSub = Math.floor(Math.random() * 21) + 10;
        revAdd = -revSub;
        nextRevenueLost += revSub;

        // Trigger Flash Sale warning recommendation once total decline hits 1000
        if (nextRevenueLost >= 1000 && !state.saleRecommendedByAI) {
          nextSaleRecommended = true;
          const alertTitle = "⚠️ CRITICAL REVENUE LOSS";
          const alertMsg = `GarKS revenue dropped by $${Math.round(nextRevenueLost)} due to highway blockages. Immediate 20% Flash Sale recommended to restore traffic.`;
          
          nextNotifications.unshift({
            id: Math.random().toString(36).substr(2, 9),
            title: alertTitle,
            message: alertMsg,
            time: 'Just now',
            type: 'sale',
            read: false
          });

          nextLogs.push(`[${new Date().toLocaleTimeString()}] [AI RECOMMENDATION] High-priority stock clearance recommended. Revenue loss exceeded $1,000. Flash sale proposal ready.`);
        }
      } else {
        // Normal positive revenue accumulation - if sale is active, boost it more
        if (state.saleActive) {
          revAdd = Math.floor(Math.random() * 3000) + 1500; // +1500 to +4500 under sale
        } else {
          revAdd = Math.floor(Math.random() * 1000) + 200; // +200 to +1200
        }
      }

      let ordAdd = Math.floor(Math.random() * 5) + 2;    // +2 to +6 normal
      if (state.saleActive) {
        ordAdd = Math.floor(Math.random() * 10) + 8; // higher orders during sale (+8 to +17)
      }
      const custAdd = Math.random() > 0.6 ? 1 : 0;         // +0 to +1
      
      const newRevenue = Math.max(0, state.kpiRevenue + revAdd);
      const newOrders = state.kpiOrders + ordAdd;
      const newCustomers = state.kpiCustomers + custAdd;
      const newAOV = Math.round((newRevenue / newOrders) * 100) / 100;

      // decrease stock for random products based on the number of orders (ordAdd)
      let updatedInventory = [...state.inventory];
      let remainingDec = ordAdd;
      
      while (remainingDec > 0) {
        const activeProducts = updatedInventory.filter(p => p.stock > 0);
        if (activeProducts.length === 0) break;
        
        const randomIndex = Math.floor(Math.random() * activeProducts.length);
        const targetProduct = activeProducts[randomIndex];
        const decreaseAmount = Math.min(remainingDec, Math.floor(Math.random() * 2) + 1); // 1 or 2 units
        remainingDec -= decreaseAmount;
        
        let newStock = Math.max(0, targetProduct.stock - decreaseAmount);
        
        // Auto-restock check if stock drops below 10
        if (newStock < 10) {
          const isShirtsOrPolos = targetProduct.category === 'Shirts' || targetProduct.category === 'Polos' || targetProduct.name.toLowerCase().includes('shirt') || targetProduct.name.toLowerCase().includes('polo');
          const isLeather = targetProduct.id === 'm3' || targetProduct.name.toLowerCase().includes('leather') || targetProduct.category === 'Leather Jackets';
          
          const vendor = isShirtsOrPolos ? 'Milan Fabrics Co.' : 'Lahore Textiles';
          const vendorId = isShirtsOrPolos ? 's1' : 's7';
          const unitCost = isLeather ? 550 : 450;
          const quantity = isLeather ? 80 : 100;
          const totalCost = quantity * unitCost;

          newStock += quantity;

          const restockMsg = `[AI AUTOMATED RESTOCK] Restocked ${quantity} units of "${targetProduct.name}" from "${vendor}" (Total: ${totalCost} PKR). Budget check within 50k limit PASS.`;
          nextLogs.push(`[${new Date().toLocaleTimeString()}] ${restockMsg}`);

          nextNotifications.unshift({
            id: Math.random().toString(36).substr(2, 9),
            title: "🤖 AI AUTOMATED RESTOCK",
            message: `Ordered ${quantity} units of ${targetProduct.name} from ${vendor}. Total: ${totalCost} PKR.`,
            time: 'Just now',
            type: 'inventory',
            read: false
          });

          const newPO: PurchaseOrder = {
            id: `PO-${Math.floor(Math.random() * 900) + 100}`,
            supplierId: vendorId,
            productId: targetProduct.id,
            quantity: quantity,
            status: 'Completed',
            createdAt: new Date().toISOString().split('T')[0],
            totalCost: totalCost
          };
          nextPurchaseOrders.push(newPO);

          // Also try to sync warehouse DB on server if running
          fetch('http://localhost:3001/warehouse/' + targetProduct.id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: newStock })
          }).catch(() => {});
        }

        updatedInventory = updatedInventory.map(p => 
          p.id === targetProduct.id ? { ...p, stock: newStock } : p
        );

        if (newStock < 5 && targetProduct.stock >= 5) {
          // Low stock alert! Pushed once when dropping below 5
          const lowStockNotif: Notification = {
            id: Math.random().toString(36).substr(2, 9),
            title: "⚠️ CRITICAL LOW STOCK",
            message: `Product "${targetProduct.name}" in category "${targetProduct.category}" has dropped to ${newStock} units. Restock suggested.`,
            time: 'Just now',
            type: 'inventory',
            read: false
          };
          nextNotifications.unshift(lowStockNotif);
          nextLogs.push(`[${new Date().toLocaleTimeString()}] [INVENTORY ALERT] ${targetProduct.name} stock level is critical (${newStock} remaining).`);
        }
      }

      // Timely update marketing campaigns
      const updatedCampaigns = state.campaigns.map(c => {
        if (c.status === 'Active') {
          const currentReach = parseFloat(c.reach.replace('k', ''));
          const randomReachChange = (Math.random() * 0.4 - 0.1).toFixed(1);
          const newReachVal = Math.max(0.1, currentReach + parseFloat(randomReachChange)).toFixed(1);
          
          const currentCtr = parseFloat(c.ctr.replace('%', ''));
          const randomCtrChange = (Math.random() * 0.6 - 0.2).toFixed(1);
          const newCtrVal = Math.max(0.1, currentCtr + parseFloat(randomCtrChange)).toFixed(1);

          return {
            ...c,
            reach: `${newReachVal}k`,
            ctr: `${newCtrVal}%`
          };
        }
        return c;
      });

      return {
        ticksCount: currentTicks,
        revenueDecreasingMode: nextRevenueMode,
        revenueLostCounter: nextRevenueLost,
        saleRecommendedByAI: nextSaleRecommended,
        agentLogs: nextLogs,
        notifications: nextNotifications,
        kpiRevenue: newRevenue,
        kpiOrders: newOrders,
        kpiCustomers: newCustomers,
        kpiAOV: newAOV,
        inventory: updatedInventory,
        campaigns: updatedCampaigns,
        purchaseOrders: nextPurchaseOrders
      };
    });
  },

  orderRestock: (category) => {
    set((state) => {
      const updatedCategories = state.orderedCategories.includes(category)
        ? state.orderedCategories
        : [...state.orderedCategories, category];

      // Auto-restock category items to 50
      const updatedInventory = state.inventory.map(p => 
        p.category === category ? { ...p, stock: 50 } : p
      );

      const logMsg = `[${new Date().toLocaleTimeString()}] Emergency Restock ORDERED for category: ${category}.`;
      
      const newNotification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        title: "📦 RESTOCK ORDER PLACED",
        message: `AI placed a restock order for all low-stock items in category: ${category}.`,
        time: 'Just now',
        type: 'inventory',
        read: false
      };

      // Clear orderedCategories list instantly for this category so label hides
      const instantClearedCategories = state.orderedCategories.filter(c => c !== category);

      return {
        orderedCategories: instantClearedCategories,
        inventory: updatedInventory,
        agentLogs: [...state.agentLogs, logMsg],
        notifications: [newNotification, ...state.notifications]
      };
    });
  },

  cancelRestock: (category) => {
    set((state) => {
      const logMsg = `[${new Date().toLocaleTimeString()}] Emergency Restock CANCELED for category: ${category}.`;
      // Set to 5 to clear active < 5 alert without full restock
      const updatedInventory = state.inventory.map(p => 
        p.category === category && p.stock < 5 ? { ...p, stock: 5 } : p
      );

      return {
        inventory: updatedInventory,
        agentLogs: [...state.agentLogs, logMsg]
      };
    });
  },

  orderSupplierRestock: (productId, amount, vendorId, isAiAutomated) => {
    set((state) => {
      const targetProduct = state.inventory.find(p => p.id === productId);
      if (!targetProduct) return {};

      const updatedInventory = state.inventory.map(p => 
        p.id === productId ? { ...p, stock: p.stock + amount } : p
      );

      const supplier = state.suppliers.find(s => s.id === vendorId) || { name: 'Direct Vendor', company: 'GarKS Partner' };
      const totalCost = amount * targetProduct.price * (isAiAutomated ? 0.7 : 1);
      const orderId = `PO-${Math.floor(Math.random() * 900) + 100}`;

      const newPO: PurchaseOrder = {
        id: orderId,
        supplierId: vendorId,
        productId: productId,
        quantity: amount,
        status: 'Completed',
        createdAt: new Date().toISOString().split('T')[0],
        totalCost: Math.round(totalCost)
      };

      const logMsg = `[${new Date().toLocaleTimeString()}] ${isAiAutomated ? '🤖 AI' : '👤 Manual'} restock completed for "${targetProduct.name}" (${amount} units ordered from ${supplier.company}) at a cost of $${Math.round(totalCost)}.`;

      // Trigger notification
      const newNotification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        title: isAiAutomated ? "🤖 AI AUTOMATED RESTOCK" : "👤 MANUAL VENDOR RESTOCK",
        message: `Ordered ${amount} units of ${targetProduct.name} from ${supplier.company}. Total: $${Math.round(totalCost)}.`,
        time: 'Just now',
        type: 'inventory',
        read: false
      };

      return {
        inventory: updatedInventory,
        purchaseOrders: [...state.purchaseOrders, newPO],
        agentLogs: [...state.agentLogs, logMsg],
        notifications: [newNotification, ...state.notifications]
      };
    });
  },

  setSaleBannerDismissed: (dismissed) => set({ saleBannerDismissed: dismissed }),

  addProduct: (productInfo) => set((state) => {
    const newProduct: Product = {
      ...productInfo,
      id: `p-${Math.random().toString(36).substr(2, 9)}`,
    };
    const logMsg = `[${new Date().toLocaleTimeString()}] Admin manually added a new product category: ${productInfo.category} - ${productInfo.name}.`;
    return {
      inventory: [newProduct, ...state.inventory],
      agentLogs: [...state.agentLogs, logMsg]
    };
  })
    }),
    {
      name: 'garks-premium-store',
      partialize: (state) => ({
        user: state.user,
        mode: state.mode,
        theme: state.theme,
        cart: state.cart,
        wishlist: state.wishlist,
        inventory: state.inventory,
        suppliers: state.suppliers,
        purchaseOrders: state.purchaseOrders,
        orders: state.orders,
        notifications: state.notifications,
        campaigns: state.campaigns,
        isLoggedIn: state.isLoggedIn,
        isLocked: state.isLocked,
        adminPassword: state.adminPassword,
        adminSecurityCode: state.adminSecurityCode,
        saleActive: state.saleActive,
        saleEndTime: state.saleEndTime,
        saleDiscount: state.saleDiscount,
        agentLogs: state.agentLogs,
        agentRunning: state.agentRunning,
        lastAgentResult: state.lastAgentResult,
        stockoutRisk: state.stockoutRisk,
        kpiRevenue: state.kpiRevenue,
        kpiOrders: state.kpiOrders,
        kpiCustomers: state.kpiCustomers,
        kpiAOV: state.kpiAOV,
        orderedCategories: state.orderedCategories,
        revenueDecreasingMode: state.revenueDecreasingMode,
        revenueLostCounter: state.revenueLostCounter,
        ticksCount: state.ticksCount,
        saleRecommendedByAI: state.saleRecommendedByAI,
        saleBannerDismissed: state.saleBannerDismissed,
        notificationsMuted: state.notificationsMuted
      }),
    }
  )
);
