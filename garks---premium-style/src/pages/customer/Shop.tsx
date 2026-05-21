import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sendSaleEndEmail } from '../../services/emailService';
import { 
  Filter, SlidersHorizontal, 
  ShoppingBag, Star, 
  TrendingUp, Grid2X2, LayoutList, Plus, Search,
  X, Zap
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import GargiEmptyState from '../../components/GargiEmptyState';

export default function Shop() {
  const { 
    inventory, cartFeedback, addToCart,
    saleActive, saleEndTime, saleDiscount,
    fetchProducts, endSale
  } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [search, setSearch] = useState(location.state?.search || '');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState(location.state?.filter || 'All');

  const [timeLeft, setTimeLeft] = useState<string>('');
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  // Polling products and sale status from backend
  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 10000);
    return () => clearInterval(interval);
  }, [fetchProducts]);

  // Request native browser notification permissions on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Countdown timer hook
  useEffect(() => {
    if (!saleActive || !saleEndTime) {
      setTimeLeft('');
      return;
    }

    const updateCountdown = () => {
      const difference = new Date(saleEndTime).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft('00:00:00');
        const currentDiscount = saleDiscount;
        endSale();
        try {
          sendSaleEndEmail(currentDiscount, 0);
        } catch (emailErr) {
          console.error("Failed to send sale end email:", emailErr);
        }
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const formatted = [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
      ].join(':');

      setTimeLeft(formatted);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [saleActive, saleEndTime, saleDiscount, endSale]);

  // Reset banner dismissed state if sale ends
  useEffect(() => {
    if (!saleActive) {
      setBannerDismissed(false);
    }
  }, [saleActive]);

  useEffect(() => {
    if (location.state?.filter) setActiveFilter(location.state.filter);
    if (location.state?.search) setSearch(location.state.search);
  }, [location.state]);

  const categories = ['All', 'Shirts', 'Pants', 'Hoodies', 'Polo Shirts', 'Leather Jackets', 'Bags', 'Shoes', 'Accessories', 'Women', 'Children'];

  const filteredItems = inventory.filter(p => 
    (activeFilter === 'All' || p.category === activeFilter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || 
     p.category.toLowerCase().includes(search.toLowerCase()) ||
     p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col pb-64">
      <PageHeader 
        title="Boutique" 
        subtitle="The Series Collection" 
        showBack 
        rightElement={
          <button 
            onClick={() => navigate('/customer/cart')}
            className="px-5 py-2.5 bg-brand-secondary text-brand-bg rounded-full font-mono text-[10px] font-bold uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl shadow-brand-secondary/10"
          >
            Review Collection
          </button>
        }
      />
      
      <div className="px-6 space-y-10 pt-4">
        {/* Pulsing Active Sale Banner */}
        <AnimatePresence>
          {saleActive && !bannerDismissed && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -20 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -20 }}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.4}
              whileDrag={{ scale: 1.01 }}
              className="w-full bg-gradient-to-r from-red-500/20 via-red-500/10 to-rose-500/20 border border-red-500/30 rounded-3xl p-5 flex items-center justify-between gap-4 shadow-xl shadow-red-500/5 relative overflow-hidden group select-none shrink-0"
            >
              {/* Pulsing light flare */}
              <div className="absolute inset-0 bg-red-500/5 opacity-50 animate-pulse pointer-events-none" />
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2.5 bg-red-500/15 text-red-400 rounded-full border border-red-500/20 animate-pulse">
                  <Zap size={16} fill="currentColor" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-mono text-red-400 uppercase tracking-widest font-black flex items-center gap-1.5">
                    FLASH SALE LIVE
                  </h4>
                  <p className="text-brand-text font-serif italic text-xs leading-relaxed">
                    Agent launched <span className="text-red-400 font-bold font-mono">{saleDiscount}% OFF</span> adaptive strategy
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 relative z-10">
                {/* Countdown timer badge */}
                <div className="bg-red-950/40 border border-red-500/20 px-3.5 py-2 rounded-2xl flex flex-col items-center justify-center shrink-0">
                  <span className="text-[7px] font-mono text-red-400/80 uppercase tracking-widest font-bold">Ends In</span>
                  <span className="text-xs font-mono font-black text-red-400 tracking-tight mt-0.5">{timeLeft || '00:00:00'}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setBannerDismissed(true);
                  }}
                  className="p-2 bg-white/5 hover:bg-white/10 text-brand-muted hover:text-brand-text rounded-xl border border-white/5 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating draggable reopen badge if sale active but dismissed */}
        <AnimatePresence>
          {saleActive && bannerDismissed && (
            <motion.div
              drag
              dragConstraints={{ left: -20, right: 20, top: -20, bottom: 20 }}
              dragElastic={0.6}
              onClick={() => setBannerDismissed(false)}
              initial={{ scale: 0, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 50 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="fixed right-6 bottom-24 z-50 p-4 bg-gradient-to-br from-red-600/90 to-rose-600/95 text-white rounded-full shadow-2xl shadow-red-500/20 cursor-pointer flex items-center justify-center border border-red-400/30 select-none group"
            >
              <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-40 animate-pulse group-hover:scale-110 transition-transform" />
              <div className="relative flex flex-col items-center justify-center gap-0.5 text-center shrink-0">
                <Zap size={14} className="text-white fill-white animate-bounce" />
                <span className="font-mono text-[8px] font-black tracking-tight">{saleDiscount}% OFF</span>
                <span className="font-mono text-[7px] text-white/80 tracking-tighter mt-0.5">{timeLeft || '00:00:00'}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tool Bar */}
      <div className="space-y-8">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-muted/40 group-focus-within:text-brand-primary transition-colors" size={18} strokeWidth={1} />
          <input 
            type="text" 
            placeholder="Search by name, category, fabric..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-card border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-brand-text placeholder:text-brand-muted/20 focus:border-brand-primary outline-none transition-all font-mono text-xs tracking-tight"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[9px] font-mono text-brand-muted uppercase tracking-[0.3em] font-bold">Categories</span>
            <button onClick={() => setActiveFilter('All')} className="text-[9px] font-mono text-brand-secondary uppercase tracking-[0.2em] hover:brightness-110">Clear Filter</button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
            {categories.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-6 py-3 rounded-2xl text-[9px] whitespace-nowrap font-mono uppercase tracking-[0.2em] transition-all border ${
                  activeFilter === f ? 'bg-brand-primary border-brand-primary text-black font-bold shadow-xl shadow-brand-primary/10' : 'bg-brand-card text-brand-muted border-white/5 hover:border-brand-primary/30'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between bg-brand-card/30 p-2.5 rounded-2xl border border-white/5">
          <span className="text-[9px] font-mono text-brand-muted px-3 uppercase tracking-widest">{filteredItems.length} curated pieces</span>
          <div className="flex gap-2 p-1 bg-brand-bg rounded-xl border border-white/5">
            <button 
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-brand-card text-brand-primary shadow-sm shadow-brand-primary/10' : 'text-brand-muted/40'}`}
            >
              <Grid2X2 size={16} strokeWidth={1.5} />
            </button>
            <button 
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-brand-card text-brand-primary shadow-sm shadow-brand-primary/10' : 'text-brand-muted/40'}`}
            >
              <LayoutList size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className={`grid gap-x-6 gap-y-10 ${view === 'grid' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <AnimatePresence mode="popLayout">
          {filteredItems.map((product) => {
            const isAdded = cartFeedback === product.id;
            
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={product.id}
                onClick={() => navigate(`/customer/product/${product.id}`)}
                className={`group cursor-pointer ${view === 'list' ? 'flex gap-6 bg-brand-card p-5 rounded-[2rem] border border-white/5 shadow-xl' : ''}`}
              >
                <div className={`relative rounded-[2rem] overflow-hidden bg-brand-card shrink-0 border border-white/5 shadow-2xl ${view === 'grid' ? 'aspect-[4/5] mb-4' : 'w-24 h-24'}`}>
                  <img 
                    src={product.image} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
                    alt={product.name}
                  />
                  
                  {/* Dynamic Sale Badge */}
                  {product.onSale && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-rose-600 text-white px-2.5 py-1 rounded-full border border-red-500/30 flex items-center gap-1 shadow-lg shadow-red-500/20 z-10">
                      <span className="text-[8px] font-mono font-bold uppercase tracking-tighter">
                        {product.discountPercent}% OFF
                      </span>
                    </div>
                  )}

                  <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 flex items-center gap-1.5 z-10">
                    <Star size={8} className="text-brand-secondary fill-brand-secondary" />
                    <span className="text-[8px] font-mono text-white font-bold">{product.rating}</span>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col justify-center gap-1">
                  <p className="text-[9px] font-mono text-brand-muted uppercase tracking-[0.2em]">{product.category}</p>
                  <h4 className="text-[13px] font-medium text-brand-text truncate pr-4">{product.name}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex flex-col gap-0.5">
                      {product.onSale && product.originalPrice ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-brand-muted line-through font-mono text-[10px]">${product.originalPrice.toFixed(2)}</span>
                          <span className="text-red-400 font-bold font-mono text-xs tracking-tighter">${product.price.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-brand-secondary font-bold font-mono text-xs tracking-tighter">${product.price.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button 
                        animate={isAdded ? { scale: [1, 1.2, 1] } : {}}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product, e);
                        }}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-xl ${
                          isAdded 
                            ? 'bg-brand-primary text-black shadow-brand-primary/20' 
                            : 'bg-brand-card border border-white/10 text-brand-muted hover:border-brand-primary hover:text-brand-primary'
                        }`}
                      >
                        {isAdded ? <ShoppingBag size={16} /> : <Plus size={16} />}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredItems.length === 0 && (
        <GargiEmptyState 
          title="Selection Unavailable" 
          description="Our concierge couldn't locate any matching pieces in the current series. Try adjusting your refinement or view the full boutique."
          actionLabel="View All Pieces"
          onAction={() => setActiveFilter('All')}
        />
      )}
      </div>
    </div>
  );
}
