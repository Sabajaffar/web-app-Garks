import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ChevronLeft, ShoppingBag, Star, 
  Share2, Heart, ShieldCheck, 
  Truck, ArrowRight, Bell, Plus, BrainCircuit
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useState, useEffect } from 'react';
import { haptic } from '../../lib/utils';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { inventory, addToCart, notifications, wishlist, toggleWishlist, trackView } = useStore();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const product = inventory.find(p => p.id === id);
  const unreadCount = notifications.filter(n => !n.read).length;
  const isLiked = wishlist.includes(id || '');

  useEffect(() => {
    if (id) trackView(id);
  }, [id, trackView]);

  if (!product) return null;

  const handleAddToCart = (e?: React.MouseEvent) => {
    haptic('success');
    addToCart(product, e);
    useStore.getState().addNotification({
      title: "Selection Secured",
      message: `${product.name} has been added to your executive cart.`,
      type: 'info'
    });
  };

  const handleToggleWishlist = () => {
    haptic('medium');
    toggleWishlist(product.id);
  };

  return (
    <div className="flex-1 flex flex-col bg-brand-bg relative">
      {/* Header Controls */}
      <header className="absolute top-8 left-0 right-0 px-6 flex items-center justify-between z-10">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 bg-black/40 backdrop-blur-xl rounded-2xl text-white shadow-xl hover:bg-black/60 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/customer/notifications')}
            className="p-3 bg-black/40 backdrop-blur-xl rounded-2xl text-white shadow-xl relative"
          >
            {unreadCount > 0 && <div className="absolute top-2 right-2 w-2 h-2 bg-brand-primary rounded-full animate-pulse shadow-[0_0_8px_#3fb950]" />}
            <Bell size={20} />
          </button>
          <button 
            onClick={handleToggleWishlist}
            className="p-3 bg-black/40 backdrop-blur-xl rounded-2xl shadow-xl transition-colors"
          >
            <Heart size={20} className={isLiked ? 'fill-red-500 text-red-500' : 'text-white'} />
          </button>
        </div>
      </header>

      {/* Hero Image */}
      <div className="h-[55vh] relative overflow-hidden">
        <motion.img 
          layoutId={product.id}
          src={product.image} 
          className="w-full h-full object-cover"
          alt={product.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="flex-1 bg-brand-bg -mt-20 rounded-t-[3rem] p-8 space-y-8 pb-40">
        <header>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} size={14} className={i <= Math.floor(product.rating) ? 'text-brand-secondary fill-brand-secondary' : 'text-brand-muted'} />
            ))}
            <span className="text-xs text-brand-muted font-mono ml-2">({product.rating})</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-serif text-brand-text leading-tight">{product.name}</h1>
              {product.onSale && (
                <span className="inline-block mt-2 px-2 py-1 bg-brand-primary text-black text-[10px] font-bold uppercase tracking-wider rounded-md">
                  Flash Sale - {product.discountPercent}% OFF
                </span>
              )}
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-bold font-mono text-brand-primary">${product.price}</span>
              {product.onSale && product.originalPrice && (
                <span className="text-sm text-brand-muted line-through font-mono">${product.originalPrice}</span>
              )}
            </div>
          </div>
          <p className="text-brand-muted font-mono text-[10px] uppercase tracking-widest mt-2">{product.category}</p>
        </header>

        <p className="text-brand-muted text-sm leading-relaxed">
          {product.description}
        </p>

        {/* Size Selector */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase font-mono tracking-widest">Select Size</h4>
            <button className="text-[10px] text-brand-muted uppercase font-mono tracking-widest underline underline-offset-4">Size Guide</button>
          </div>
          <div className="flex gap-3">
            {product.variants.size.map(size => (
              <button 
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-mono text-sm transition-all border ${
                  selectedSize === size ? 'bg-brand-primary border-brand-primary text-black font-bold shadow-[0_0_15px_#3fb950]' : 'bg-brand-card border-brand-muted/10 text-brand-muted'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Color Selector */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase font-mono tracking-widest">Colorway</h4>
          <div className="flex gap-4">
            {product.variants.color.map(color => (
              <button 
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`flex flex-col items-center gap-2 group`}
              >
                <div className={`w-12 h-12 rounded-full border-2 p-1 transition-all ${
                  selectedColor === color ? 'border-brand-primary' : 'border-transparent'
                }`}>
                  <div 
                    className="w-full h-full rounded-full shadow-inner"
                    style={{ backgroundColor: color.toLowerCase() }}
                  />
                </div>
                <span className={`text-[8px] uppercase font-mono tracking-widest transition-opacity ${selectedColor === color ? 'opacity-100 text-brand-primary' : 'opacity-40 group-hover:opacity-100'}`}>
                  {color}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Inline Add to Cart (Quick Buy) */}
        <button 
          onClick={(e) => handleAddToCart(e)}
          className="w-full bg-brand-primary text-black font-bold py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl font-mono text-xs uppercase tracking-[0.2em]"
        >
          <Plus size={18} />
          <span>Add to Selection</span>
        </button>

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-brand-card p-4 rounded-2xl border border-brand-muted/5 flex flex-col gap-2">
            <ShieldCheck size={20} className="text-brand-primary" />
            <h5 className="text-[10px] font-bold uppercase font-mono">Authenticity</h5>
            <p className="text-[10px] text-brand-muted">Guaranteed Premium Quality</p>
          </div>
          <div className="bg-brand-card p-4 rounded-2xl border border-brand-muted/5 flex flex-col gap-2">
            <Truck size={20} className="text-brand-secondary" />
            <h5 className="text-[10px] font-bold uppercase font-mono">Fast Shipping</h5>
            <p className="text-[10px] text-brand-muted">Next-Day Executive Delivery</p>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase font-mono tracking-widest">Client Reviews</h4>
            <div className="flex items-center gap-1">
              <Star size={12} className="text-brand-secondary fill-brand-secondary" />
              <span className="text-[10px] font-mono text-brand-muted">{product.rating} / 5.0</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {product.reviews?.map((review, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={review.id} 
                className="bg-brand-card p-5 rounded-3xl border border-white/5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center text-[10px] text-brand-primary font-bold">
                      {review.user.charAt(0)}
                    </div>
                    <span className="text-[10px] font-bold font-mono text-brand-text uppercase">{review.user}</span>
                  </div>
                  <span className="text-[8px] font-mono text-brand-muted uppercase tracking-tighter">{review.date}</span>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={10} className={star <= review.rating ? 'text-brand-secondary fill-brand-secondary' : 'text-white/10'} />
                  ))}
                </div>
                <p className="text-[11px] text-brand-muted italic font-serif leading-relaxed">
                  "{review.comment}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Gargi Recommends - Intelligent Selection */}
        <section className="py-6 border-t border-brand-muted/10">
          <div className="mb-6 flex items-center gap-2">
            <BrainCircuit size={18} className="text-brand-primary animate-pulse" />
            <h3 className="text-lg font-serif italic">Gargi Recommends</h3>
          </div>
          <div className="flex gap-6 overflow-x-auto no-scrollbar">
            {inventory.filter(p => p.id !== product.id).slice(0, 4).map((p, i) => (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={p.id}
                onClick={() => {
                  haptic('light');
                  navigate(`/customer/product/${p.id}`);
                }}
                className="group cursor-pointer shrink-0 w-40"
              >
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3 bg-brand-card">
                  <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                </div>
                <h4 className="text-xs font-medium text-brand-text truncate mb-1">{p.name}</h4>
                <p className="text-brand-primary font-bold font-mono text-[10px]">${p.price}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-brand-bg/80 backdrop-blur-xl border-t border-brand-muted/10 px-8 flex items-center justify-between z-30">
        <div className="flex flex-col">
          <span className="text-[10px] text-brand-muted font-mono uppercase tracking-widest">Total Price</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-brand-text">${product.price}</span>
            {product.onSale && product.originalPrice && (
              <span className="text-sm text-brand-muted line-through font-mono">${product.originalPrice}</span>
            )}
          </div>
        </div>
        <button 
          onClick={(e) => handleAddToCart(e)}
          className="bg-brand-primary text-black font-bold px-10 py-5 rounded-2xl flex items-center gap-3 shadow-[0_10px_30px_#3fb95040] active:scale-95 transition-all group"
        >
          <ShoppingBag size={20} className="group-hover:rotate-12 transition-transform" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
}
