import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Grid, ShoppingCart, User, MessageSquare, Heart } from 'lucide-react';
import CustomerHome from '../pages/customer/Home';
import Shop from '../pages/customer/Shop';
import Categories from '../pages/customer/Categories';
import Cart from '../pages/customer/Cart';
import Profile from '../pages/Profile';
import ProductDetail from '../pages/customer/ProductDetail';
import Notifications from '../pages/customer/Notifications';
import Wishlist from '../pages/customer/Wishlist';
import OrderTracking from '../pages/customer/OrderTracking';
import GargiAssistant from '../components/GargiAssistant';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function CustomerLayout() {
  const { user, mode, setMode } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleReturnToAdmin = () => {
    setMode('admin');
    navigate('/admin');
  };

  const navItems = [
    { label: 'Home', icon: Home, path: '/customer' },
    { label: 'Shop', icon: ShoppingBag, path: '/customer/shop' },
    { label: 'Explore', icon: Grid, path: '/customer/categories' },
    { label: 'Cabinet', icon: Heart, path: '/customer/wishlist' },
    { label: 'Profile', icon: User, path: '/customer/profile' },
  ];

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-brand-bg">
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<CustomerHome />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/track-order/:orderId" element={<OrderTracking />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Return to Admin Floating Indicator */}
      {user?.isAdmin && mode === 'customer' && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleReturnToAdmin}
          className="fixed top-6 right-6 z-[60] bg-brand-primary/10 backdrop-blur-md border border-brand-primary/30 p-2.5 rounded-2xl flex items-center gap-2 group active:scale-95 transition-all shadow-xl shadow-brand-primary/5"
        >
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-mono text-brand-primary font-bold uppercase tracking-widest">Admin</span>
            <span className="text-[6px] font-mono text-brand-muted uppercase tracking-tighter opacity-60">Back to Console</span>
          </div>
          <div className="w-8 h-8 bg-brand-primary text-black rounded-lg flex items-center justify-center">
            <ShieldCheck size={16} />
          </div>
        </motion.button>
      )}

      {/* Gargi Floating Assistant */}
      <GargiAssistant />

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 h-20 bg-brand-bg/80 backdrop-blur-xl border-t border-brand-muted/10 px-6 flex items-center justify-between z-50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/customer' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 group relative outline-none"
            >
              <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-brand-primary bg-brand-primary/10' : 'text-brand-muted hover:text-brand-text'}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] uppercase tracking-tighter font-mono transition-all ${isActive ? 'text-brand-primary font-bold' : 'text-brand-muted opacity-0 group-hover:opacity-100'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
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
