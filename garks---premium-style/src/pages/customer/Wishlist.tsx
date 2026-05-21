import { motion, AnimatePresence } from 'motion/react';
import { Heart, Trash2, ShoppingBag, Plus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { haptic } from '../../lib/utils';
import GargiEmptyState from '../../components/GargiEmptyState';

export default function Wishlist() {
  const { wishlist, inventory, toggleWishlist, addToCart } = useStore();
  const navigate = useNavigate();
  
  const wishlistItems = inventory.filter(p => wishlist.includes(p.id));

  const handleRemove = (id: string) => {
    haptic('medium');
    toggleWishlist(id);
  };

  const handleAddToCart = (item: any) => {
    haptic('success');
    addToCart(item);
  };

  return (
    <div className="flex flex-col pb-32">
      <PageHeader title="Wishlist" subtitle={`${wishlistItems.length} styles reserved`} />

      <div className="px-6 space-y-6">
        <AnimatePresence mode="popLayout">
          {wishlistItems.length === 0 ? (
            <GargiEmptyState 
              title="Empty Wishlist" 
              description="Your selection of premium garments is currently empty. Let Gargi help you find something that resonates with your style."
              actionLabel="Discover Styles"
              onAction={() => navigate('/customer/shop')}
            />
          ) : (
            wishlistItems.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, x: -100 }}
                key={item.id}
                className="bg-brand-card p-4 rounded-3xl border border-white/5 flex gap-4"
              >
                <div 
                  onClick={() => navigate(`/customer/product/${item.id}`)}
                  className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 cursor-pointer"
                >
                  <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h4 className="text-sm font-bold text-brand-text mb-1 truncate">{item.name}</h4>
                    <p className="text-[10px] text-brand-muted font-mono uppercase">{item.category}</p>
                    <span className="text-brand-primary font-bold font-mono mt-1 block">${item.price}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleAddToCart(item)}
                      className="flex-1 bg-brand-primary text-black py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> Add
                    </button>
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="p-2 bg-brand-bg rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
