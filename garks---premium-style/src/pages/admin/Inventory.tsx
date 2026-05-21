import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Plus, Filter, 
  ChevronRight, AlertTriangle, X,
  Zap, PackagePlus
} from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function Inventory() {
  const { inventory, orderedCategories, suppliers, orderSupplierRestock, addProduct } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', stock: '', image: '' });

  const filteredItems = inventory.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col px-6 pt-8 gap-6 relative">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-brand-text">Inventory</h1>
          <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mt-1">Managed by GarKS Intel</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-3 bg-brand-primary text-black font-bold text-xs uppercase tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(63,185,80,0.3)] active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </header>

      {/* Vendors / Suppliers */}
      <section>
        <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-brand-muted mb-3 px-1">Active Vendors</h3>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {suppliers.map(s => (
            <div key={s.id} className="shrink-0 bg-brand-card px-4 py-3 rounded-2xl border border-brand-muted/10 min-w-[160px] flex flex-col gap-1">
              <h4 className="text-xs font-bold text-brand-text truncate">{s.company}</h4>
              <p className="text-[10px] text-brand-muted font-mono">{s.category}</p>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-brand-primary">
                <Zap size={10} className="fill-current" />
                <span className="font-bold">★ {s.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
        <input 
          type="text" 
          placeholder="Search products, SKUs, categories..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-brand-card border border-brand-muted/10 rounded-2xl py-4 pl-12 pr-4 text-brand-text focus:border-brand-primary outline-none transition-all font-mono text-sm"
        />
        <button className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-brand-muted">
          <Filter size={18} />
        </button>
      </div>

      {/* Quick Stats */}
      <section className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {[
          { label: 'Total Items', value: inventory.reduce((acc, item) => acc + item.stock, 0).toString(), color: 'brand-primary' },
          { label: 'Low Stock', value: inventory.filter(i => i.stock < 10).length.toString(), color: 'red-400' },
          { label: 'Valuation', value: `$${inventory.reduce((acc, item) => acc + (item.price * item.stock), 0).toLocaleString()}`, color: 'brand-secondary' },
        ].map((stat, i) => (
          <div key={i} className="shrink-0 bg-brand-card px-6 py-4 rounded-3xl border border-brand-muted/10 min-w-[140px]">
            <p className="text-[10px] font-mono text-brand-muted uppercase tracking-tighter mb-1">{stat.label}</p>
            <h4 className={`text-xl font-bold font-mono text-${stat.color}`}>{stat.value}</h4>
          </div>
        ))}
      </section>

      {/* Stock List */}
      <section className="flex-1 space-y-4 mb-8">
        {filteredItems.map((item) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            key={item.id}
            className="bg-brand-card p-4 rounded-3xl border border-brand-muted/10 flex items-center gap-4 group"
          >
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-brand-bg shrink-0">
              <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-brand-text truncate">{item.name}</h4>
              <p className="text-[10px] font-mono text-brand-muted uppercase truncate">{item.category} {item.sku ? `• ${item.sku}` : ''}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${
                  item.stock < 10 ? 'bg-red-500/20 text-red-400' : 'bg-brand-primary/20 text-brand-primary'
                }`}>
                  {item.stock} units
                </span>

                <span className="text-[10px] font-mono text-brand-muted">${item.price}</span>
              </div>
            </div>
            
            <button 
              onClick={() => orderSupplierRestock(item.id, 50, suppliers[0]?.id || 's1', false)}
              className="p-2.5 bg-brand-bg/50 border border-brand-muted/10 rounded-xl hover:bg-brand-primary hover:text-black hover:border-brand-primary transition-all text-brand-muted flex shrink-0 items-center gap-1 active:scale-95"
              title="Manual Vendor Restock"
            >
              <PackagePlus size={18} />
            </button>
          </motion.div>
        ))}
        {filteredItems.length === 0 && (
          <div className="py-12 text-center text-brand-muted">
            <Search size={40} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm">No items found matching "{search}"</p>
          </div>
        )}
      </section>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-[-24px] z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-brand-card w-full max-w-sm rounded-3xl p-6 border border-brand-muted/20 shadow-2xl relative max-h-[80vh] overflow-y-auto no-scrollbar"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-2 text-brand-muted hover:text-white bg-black/20 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
              
              <h3 className="text-xl font-serif text-brand-text mb-6 pr-8">Add New Product</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-brand-muted font-bold block mb-1.5 ml-1">Product Name</label>
                  <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-black/20 border border-brand-muted/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-primary text-white placeholder:text-white/20" placeholder="e.g. Classic Silk Scarf" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-brand-muted font-bold block mb-1.5 ml-1">Category</label>
                  <input type="text" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full bg-black/20 border border-brand-muted/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-primary text-white placeholder:text-white/20" placeholder="e.g. Accessories" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-widest text-brand-muted font-bold block mb-1.5 ml-1">Price ($)</label>
                    <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-black/20 border border-brand-muted/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-primary text-white placeholder:text-white/20" placeholder="0" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-widest text-brand-muted font-bold block mb-1.5 ml-1">Initial Stock</label>
                    <input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full bg-black/20 border border-brand-muted/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-primary text-white placeholder:text-white/20" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-brand-muted font-bold block mb-1.5 ml-1">Image URL</label>
                  <input type="text" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} className="w-full bg-black/20 border border-brand-muted/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-primary text-white placeholder:text-white/20" placeholder="https://..." />
                </div>
                
                <button 
                  onClick={() => {
                    if (newProduct.name && newProduct.category && newProduct.price) {
                      addProduct({
                        name: newProduct.name,
                        category: newProduct.category,
                        price: parseFloat(newProduct.price) || 0,
                        stock: parseInt(newProduct.stock) || 0,
                        image: newProduct.image || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80',
                        description: 'New product category added by admin.',
                        variants: { size: ['One Size'], color: ['Standard'] },
                        rating: 5.0
                      });
                      setShowAddModal(false);
                      setNewProduct({ name: '', category: '', price: '', stock: '', image: '' });
                    }
                  }}
                  disabled={!newProduct.name || !newProduct.category || !newProduct.price}
                  className="w-full py-4 mt-4 bg-brand-primary text-black rounded-xl font-bold uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Create Product
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


