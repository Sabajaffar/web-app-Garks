import { motion } from 'motion/react';
import { 
  ChevronRight, Shirt, ShoppingBag, 
  User, Footprints, Briefcase, 
  Watch, Gem, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import PageHeader from '../../components/PageHeader';

const CATS = [
  { name: "Men", items: "124 Items", icon: User, color: "#60a5fa" },
  { name: "Women", items: "286 Items", icon: ShoppingBag, color: "#e0c9a8" },
  { name: "Shirts", items: "54 Items", icon: Shirt, color: "#60a5fa" },
  { name: "Leather Jackets", items: "32 Items", icon: Briefcase, color: "#e0c9a8" },
  { name: "Bags", items: "48 Items", icon: Briefcase, color: "#60a5fa" },
  { name: "Accessories", items: "48 Items", icon: Watch, color: "#e0c9a8" },
  { name: "Shoes", items: "24 Items", icon: Footprints, color: "#60a5fa" },
];

export default function Categories() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col pb-32">
      <PageHeader title="Series" subtitle="Explore the Atelier" showBack />

      <div className="px-6 space-y-8 pt-4">
        <div className="grid grid-cols-1 gap-5">
        {CATS.map((cat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={i}
            onClick={() => navigate('/customer/shop', { state: { filter: cat.name } })}
            className="group relative bg-brand-card p-6 rounded-[2.5rem] border border-white/5 flex items-center justify-between overflow-hidden cursor-pointer active:scale-[0.98] transition-all shadow-xl"
          >
            {/* Visual Flare */}
            <div 
              className="absolute -right-4 -bottom-4 w-24 h-24 blur-[40px] opacity-5 group-hover:opacity-20 transition-opacity"
              style={{ backgroundColor: cat.color }}
            />
            
            <div className="flex items-center gap-6">
              <div 
                className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner"
                style={{ backgroundColor: `${cat.color}10`, border: `1px solid ${cat.color}20` }}
              >
                <cat.icon size={26} style={{ color: cat.color }} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[9px] font-mono text-brand-muted uppercase tracking-[0.3em] mb-1">{cat.items}</p>
                <h4 className="text-xl font-serif text-brand-text italic leading-none">{cat.name}</h4>
              </div>
            </div>

            <div className="w-10 h-10 bg-brand-bg rounded-2xl border border-white/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-black transition-all">
              <ChevronRight size={18} strokeWidth={1} />
            </div>
          </motion.div>
        ))}
      </div>

      <section className="bg-brand-secondary/5 p-10 rounded-[3rem] border border-brand-secondary/20 text-center gap-6 flex flex-col items-center">
        <div className="w-14 h-14 rounded-full bg-brand-secondary/10 flex items-center justify-center">
          <Sparkles className="text-brand-secondary" size={28} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-serif italic text-brand-text">Seek Guidance?</h3>
          <p className="text-brand-muted text-xs leading-relaxed max-w-[220px] mx-auto">Allow our concierge to assist in refining your architectural style based on your mood.</p>
        </div>
        <button 
          onClick={() => navigate('/customer/shop')}
          className="bg-brand-secondary text-[#3d2b1f] font-bold px-10 py-4 rounded-full text-[10px] uppercase tracking-[0.2em] font-mono shadow-xl shadow-brand-secondary/10 active:scale-95 transition-all"
        >
          Consult Concierge
        </button>
      </section>
      </div>
    </div>
  );
}
