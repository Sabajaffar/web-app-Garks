import { motion } from 'motion/react';
import { Search, Bell, Sparkles, TrendingUp, Star, Plus, ArrowRight, BrainCircuit } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { haptic } from '../../lib/utils';

const CATEGORIES = [
  { name: 'Men', image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80' },
  { name: 'Women', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80' },
  { name: 'Bags', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80' },
  { name: 'Leather', image: 'https://images.unsplash.com/photo-1590739225287-bd31519780c3?auto=format&fit=crop&q=80' },
];

export default function CustomerHome() {
  const { user, inventory, addToCart, cartFeedback, saleActive, saleDiscount } = useStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 p-6">
        <div className="flex justify-between items-center bg-brand-card h-16 rounded-2xl animate-pulse" />
        <div className="bg-brand-card h-12 rounded-2xl animate-pulse" />
        <div className="bg-brand-card h-44 rounded-3xl animate-pulse" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-20 h-20 bg-brand-card rounded-2xl animate-pulse shrink-0" />
          ))}
        </div>
        <div className="bg-brand-card h-64 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-32">
      <div className="px-6 py-8 flex flex-col gap-1">
        <h1 className="text-4xl font-serif italic text-brand-text">Evening, {user?.username?.split(' ')[0] || 'Dear'}</h1>
        <p className="text-[10px] font-mono text-brand-muted uppercase tracking-[0.3em]">Welcome to your private atelier</p>
      </div>

      {saleActive && (
        <section className="px-6 mb-4">
          <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-brand-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
                <Sparkles size={16} className="text-brand-primary" />
              </div>
              <div>
                <h3 className="text-brand-primary font-bold uppercase tracking-wider text-xs">Flash Sale Active</h3>
                <p className="text-brand-text text-[10px] mt-0.5">Enjoy {saleDiscount}% off on selected premium items.</p>
              </div>
            </div>
            <div className="bg-brand-primary text-black px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider animate-pulse">
              {saleDiscount}% OFF
            </div>
          </div>
        </section>
      )}

      {/* Hero Exhibition */}
      <section className="px-6 py-2">
        <motion.div 
          onClick={() => navigate('/customer/shop')}
          whileHover={{ scale: 1.01 }}
          className="relative h-[60vh] rounded-[3rem] overflow-hidden shadow-2xl group cursor-pointer border border-white/5"
        >
          <img 
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80" 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms] brightness-[0.8]"
            alt="Hero"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-transparent to-transparent p-10 flex flex-col justify-end gap-4">
            <span className="text-brand-secondary font-mono text-[9px] uppercase tracking-[0.4em] mb-2 font-bold">New Summer Edition</span>
            <h3 className="text-5xl font-serif text-white mb-6 leading-tight italic">Ethereal<br />Silk & Linen</h3>
            <button className="w-fit bg-brand-secondary text-[#3d2b1f] text-[10px] font-bold px-8 py-4 rounded-full flex items-center gap-3 active:scale-95 transition-all shadow-xl shadow-brand-secondary/20 uppercase tracking-widest">
              Explore Collection <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Smart Concierge Entry - Subtle */}
      <section className="px-6 py-8">
        <div 
          onClick={() => navigate('/customer/shop')}
          className="bg-brand-card rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-brand-primary/10 transition-colors" />
          <div className="flex items-start justify-between relative z-10">
            <div className="max-w-[70%]">
              <h3 className="text-xl font-serif italic text-brand-text mb-2">Style Discovery</h3>
              <p className="text-xs text-brand-muted leading-relaxed">Describe your mood or an occasion, and let our intelligence refine your selection.</p>
            </div>
            <div className="w-12 h-12 bg-brand-bg border border-brand-border rounded-2xl flex items-center justify-center text-brand-primary">
              <Sparkles size={20} />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3 text-brand-secondary font-mono text-[9px] uppercase tracking-[0.2em] font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
            Concierge Active & Ready
          </div>
        </div>
      </section>

      {/* Categories Horizontal Scroll */}
      <section className="py-6 border-y border-white/5 bg-brand-card/20 overflow-hidden">
        <div className="px-6 mb-8 flex items-center justify-between">
          <h3 className="text-2xl font-serif italic">The Segments</h3>
          <button 
            onClick={() => navigate('/customer/categories')}
            className="text-brand-muted text-[9px] font-mono uppercase tracking-[0.2em] hover:text-brand-primary transition-colors"
          >
            Refine All
          </button>
        </div>
        <div className="flex gap-8 overflow-x-auto px-6 no-scrollbar">
          {CATEGORIES.map((cat, i) => (
            <motion.div 
              key={i}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/customer/shop', { state: { filter: cat.name } })}
              className="flex flex-col items-start gap-4 shrink-0 group cursor-pointer"
            >
              <div className="w-32 h-44 rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl relative grayscale hover:grayscale-0 transition-all duration-700">
                <img src={cat.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={cat.name} />
                <div className="absolute inset-0 bg-brand-bg/20 group-hover:bg-transparent transition-colors" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-brand-secondary uppercase tracking-widest font-bold">{cat.name}</span>
                <span className="text-[8px] font-mono text-brand-muted uppercase tracking-[0.2em]">View Series</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Curated For You */}
      <section className="py-12">
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="h-px flex-1 bg-brand-border" />
          <h3 className="text-2xl font-serif italic px-2">Curated selection</h3>
          <div className="h-px flex-1 bg-brand-border" />
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 px-6">
          {inventory.slice(0, 4).map((product, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={product.id}
              onClick={() => {
                haptic('light');
                navigate(`/customer/product/${product.id}`);
              }}
              className="group cursor-pointer flex flex-col gap-4"
            >
              <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-brand-card border border-white/5 shadow-xl">
                <img 
                  src={product.image} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
                  alt={product.name}
                />
                <div className="absolute top-4 right-4 h-8 w-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus size={16} className="text-white" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-mono text-brand-muted uppercase tracking-[0.2em]">{product.category}</p>
                  {product.onSale && (
                    <span className="text-[8px] font-bold bg-brand-primary text-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">SALE</span>
                  )}
                </div>
                <h4 className="text-sm font-medium text-brand-text truncate pr-2">{product.name}</h4>
                <div className="flex items-center gap-2">
                  <p className="text-brand-secondary font-bold font-mono text-xs mt-1 tracking-tighter">${product.price}</p>
                  {product.onSale && product.originalPrice && (
                    <p className="text-brand-muted font-mono text-[10px] mt-1 tracking-tighter line-through">${product.originalPrice}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Lifestyle Narrative */}
      <section className="px-6 py-12 bg-white/5 border-y border-white/5">
        <div className="flex flex-col items-center text-center max-w-xs mx-auto gap-6">
          <span className="text-[9px] font-mono text-brand-primary uppercase tracking-[0.4em] font-bold">The Narrative</span>
          <p className="text-3xl font-serif italic text-brand-text leading-tight">
            "Clothing is the armor to survive the reality of everyday life."
          </p>
          <p className="text-[10px] font-mono text-brand-muted uppercase tracking-[0.1em] opacity-60 italic">— GarKS Philosophy</p>
        </div>
      </section>
    </div>
  );
}
