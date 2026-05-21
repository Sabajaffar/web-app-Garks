import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Megaphone, BrainCircuit, Bell, User, Truck } from 'lucide-react';
import AdminDashboard from '../pages/admin/Dashboard';
import Inventory from '../pages/admin/Inventory';
import Suppliers from '../pages/admin/Suppliers';
import Marketing from '../pages/admin/Marketing';
import AIIntelligence from '../pages/admin/AIIntelligence';
import Alerts from '../pages/admin/Alerts';
import Profile from '../pages/Profile';
import GargiAssistant from '../components/GargiAssistant';
import NotificationCenter from '../components/NotificationCenter';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const { inventory, livelyUpdateMetrics, notifications, notificationsMuted } = useStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  const [latestToast, setLatestToast] = useState<any>(null);

  useEffect(() => {
    const latest = notifications.find(n => !n.read);
    if (latest && !notificationsMuted) {
      setLatestToast(latest);
      const t = setTimeout(() => setLatestToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notifications, notificationsMuted]);

  // Lively dynamic ticker every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      livelyUpdateMetrics();
    }, 7000);
    return () => clearInterval(timer);
  }, [livelyUpdateMetrics]);

  const lowStockCount = inventory.filter(p => p.stock < 5).length;

  const navItems = [
    { label: 'Dash', icon: LayoutDashboard, path: '/admin' },
    { label: 'Stock', icon: Package, path: '/admin/inventory' },
    { label: 'Growth', icon: Megaphone, path: '/admin/marketing' },
    { label: 'Assistant', icon: BrainCircuit, path: '/admin/ai' },
    { label: 'Alerts', icon: Bell, path: '#', onClick: () => setShowNotifications(true) },
    { label: 'Profile', icon: User, path: '/admin/profile' },
  ];

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-brand-bg">
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/ai" element={<AIIntelligence />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {latestToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-brand-card border border-brand-primary/30 shadow-2xl p-4 rounded-3xl z-[120] w-[90%] max-w-[340px] flex gap-3 pointer-events-none"
          >
            <div className="bg-brand-primary/20 p-2 h-fit rounded-xl">
              <Bell size={16} className="text-brand-primary" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-brand-text leading-tight">{latestToast.title}</h4>
              <p className="text-[10px] text-brand-muted mt-1 leading-snug">{latestToast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gargi Floating Assistant */}
      <GargiAssistant />

      <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* Admin Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 h-20 bg-brand-bg/80 backdrop-blur-xl border-t border-brand-primary/20 px-6 flex items-center justify-between z-50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/admin' && item.path !== '#' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.onClick ? item.onClick : () => navigate(item.path)}
              className="flex flex-col items-center gap-1 group relative"
            >
              <div className={`p-2 rounded-xl transition-all duration-300 relative ${isActive ? 'text-brand-primary bg-brand-primary/10' : 'text-brand-muted hover:text-brand-text'}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {item.label === 'Assistant' && lowStockCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-[0_0_8px_#ef4444] animate-pulse">
                    {lowStockCount}
                  </span>
                )}
                {item.label === 'Alerts' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand-primary text-[8px] font-bold text-black shadow-[0_0_8px_#3fb950] animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] uppercase tracking-tighter font-mono transition-all ${isActive ? 'text-brand-primary font-bold' : 'text-brand-muted opacity-0 group-hover:opacity-100'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="adminActiveTab"
                  className="absolute -bottom-4 w-1.5 h-1.5 bg-brand-primary rounded-full shadow-[0_0_12px_#60a5fa]"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
