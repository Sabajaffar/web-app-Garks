import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Search, Plus, Filter, 
  ChevronRight, Phone, Mail, MapPin,
  Truck, Package, DollarSign, Star, X, Clock, Calendar, CheckCircle2
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { haptic } from '../../lib/utils';

export default function Suppliers() {
  const { suppliers, purchaseOrders, inventory, addSupplier, addPurchaseOrder } = useStore();
  const [search, setSearch] = useState('');
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [selectedSupplierForHistory, setSelectedSupplierForHistory] = useState<string | null>(null);
  const [selectedSupplierForPurchase, setSelectedSupplierForPurchase] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    category: 'Fabric',
    phone: '',
    email: '',
    address: ''
  });

  const [purchaseData, setPurchaseData] = useState({
    productId: '',
    quantity: 1,
    unitCost: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSupplier = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      contactPerson: formData.name,
      rating: 5.0
    };
    addSupplier(newSupplier as any);
    setShowAddSupplier(false);
    setFormData({ company: '', name: '', category: 'Fabric', phone: '', email: '', address: '' });
  };

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPurchase || !purchaseData.productId) return;

    const newPO = {
      id: `PO-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      supplierId: selectedSupplierForPurchase,
      productId: purchaseData.productId,
      quantity: purchaseData.quantity,
      status: 'Sent' as const,
      createdAt: new Date().toISOString().split('T')[0],
      totalCost: purchaseData.quantity * purchaseData.unitCost
    };

    addPurchaseOrder(newPO);
    setSelectedSupplierForPurchase(null);
    setPurchaseData({ productId: '', quantity: 1, unitCost: 0 });
    
    useStore.getState().setToast("Purchase Order Dispatched");
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.company.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col px-6 pt-8 pb-8 gap-8 w-full">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-brand-text italic leading-tight">Suppliers</h1>
          <p className="text-brand-muted text-[9px] font-mono uppercase tracking-[0.2em] mt-1">Vendor & Logistical Management</p>
        </div>
        <button 
          onClick={() => setShowAddSupplier(true)}
          className="p-3 bg-brand-primary text-black rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-3 gap-4">
        {[
          { label: 'Vendors', value: suppliers.length.toString(), icon: Users, color: '#3fb950' },
          { label: 'Active POs', value: purchaseOrders.filter(p => p.status !== 'Completed').length.toString(), icon: Package, color: '#d4a373' },
          { label: 'Liability', value: `$${purchaseOrders.filter(p => p.status !== 'Completed').reduce((acc, p) => acc + p.totalCost, 0).toLocaleString()}`, icon: DollarSign, color: '#60a5fa' },
        ].map((stat, i) => (
          <div key={i} className="bg-brand-card p-4 rounded-3xl border border-brand-muted/10">
            <stat.icon size={16} style={{ color: stat.color }} className="mb-2" />
            <p className="text-[8px] font-mono text-brand-muted uppercase tracking-widest">{stat.label}</p>
            <h4 className="text-lg font-bold font-mono mt-1">{stat.value}</h4>
          </div>
        ))}
      </section>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
        <input 
          type="text" 
          placeholder="Search vendors, company, region..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-brand-card border border-brand-muted/10 rounded-2xl py-4 pl-12 pr-4 text-brand-text focus:border-brand-primary outline-none transition-all font-mono text-sm"
        />
      </div>

      {/* Supplier List */}
      <section className="flex-1 space-y-4 mb-8">
        <h3 className="text-xs font-mono text-brand-muted uppercase tracking-[0.2em] px-2">Primary Vendors</h3>
        {filteredSuppliers.map((supplier) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={supplier.id}
            className="bg-brand-card p-6 rounded-[2rem] border border-brand-muted/10 flex flex-col gap-4 group hover:border-brand-primary/30 transition-all shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center border border-white/5">
                  <Truck size={24} className="text-brand-primary/60" />
                </div>
                <div>
                  <h4 className="text-lg font-serif text-brand-text italic leading-tight">{supplier.company}</h4>
                  <p className="text-[10px] font-mono text-brand-muted uppercase tracking-widest">{supplier.name} • {supplier.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-brand-primary/10 px-2 py-1 rounded-lg">
                <Star size={10} className="text-brand-primary fill-brand-primary" />
                <span className="text-[10px] font-mono text-brand-primary font-bold">{supplier.rating}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-[10px] font-mono text-brand-muted">
                <Phone size={12} className="text-brand-primary/40" />
                <span>{supplier.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-brand-muted">
                <Mail size={12} className="text-brand-primary/40" />
                <span className="truncate">{supplier.email}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-brand-muted col-span-2">
                <MapPin size={12} className="text-brand-primary/40" />
                <span className="truncate">{supplier.address}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex gap-2">
              <button 
                onClick={() => {
                  haptic('light');
                  setSelectedSupplierForHistory(supplier.id);
                }}
                className="flex-1 py-3 bg-brand-bg rounded-xl text-[10px] font-mono uppercase tracking-widest text-brand-muted hover:text-white border border-white/5 transition-all flex items-center justify-center gap-2"
              >
                <Clock size={12} /> History
              </button>
              <button 
                onClick={() => {
                  haptic('medium');
                  setSelectedSupplierForPurchase(supplier.id);
                }}
                className="flex-1 py-3 bg-brand-primary text-black rounded-xl text-[10px] font-mono uppercase tracking-widest font-bold shadow-lg shadow-brand-primary/10 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={12} /> New Order
              </button>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Add Supplier Modal Simulation */}
      <AnimatePresence>
        {showAddSupplier && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-brand-card rounded-[2.5rem] border border-white/10 p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl" />
              <button 
                onClick={() => setShowAddSupplier(false)}
                className="absolute top-6 right-6 p-2 bg-brand-bg rounded-xl text-brand-muted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="text-3xl font-serif text-brand-text mb-2 italic leading-tight">New Partner</h3>
              <p className="text-brand-muted text-[10px] font-mono uppercase tracking-[0.2em] mb-8">Onboard a new supplier</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                  required
                  type="text" 
                  placeholder="Company Name" 
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  className="w-full bg-brand-bg border border-white/5 rounded-xl py-4 px-6 text-brand-text text-xs font-mono outline-none focus:border-brand-primary/50 transition-all" 
                />
                <input 
                  required
                  type="text" 
                  placeholder="Contact Person" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-brand-bg border border-white/5 rounded-xl py-4 px-6 text-brand-text text-xs font-mono outline-none focus:border-brand-primary/50 transition-all" 
                />
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-brand-bg border border-white/5 rounded-xl py-4 px-6 text-brand-text text-xs font-mono outline-none focus:border-brand-primary/50 transition-all appearance-none"
                  >
                    <option value="Fabric">Fabric</option>
                    <option value="Leather">Leather</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                  <input 
                    required
                    type="text" 
                    placeholder="Phone" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-brand-bg border border-white/5 rounded-xl py-4 px-6 text-brand-text text-xs font-mono outline-none focus:border-brand-primary/50 transition-all" 
                  />
                </div>
                <input 
                  required
                  type="email" 
                  placeholder="Email Address" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-brand-bg border border-white/5 rounded-xl py-4 px-6 text-brand-text text-xs font-mono outline-none focus:border-brand-primary/50 transition-all" 
                />
                <input 
                  required
                  type="text" 
                  placeholder="Address" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-brand-bg border border-white/5 rounded-xl py-4 px-6 text-brand-text text-xs font-mono outline-none focus:border-brand-primary/50 transition-all" 
                />

                <button 
                  type="submit"
                  className="w-full bg-brand-primary text-black font-bold py-5 rounded-2xl mt-4 shadow-xl shadow-brand-primary/10 active:scale-95 transition-all font-mono text-[10px] uppercase tracking-widest"
                >
                  Add Supplier
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order History Modal */}
      <AnimatePresence>
        {selectedSupplierForHistory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-brand-card rounded-[2.5rem] border border-white/10 p-8 relative overflow-hidden flex flex-col max-h-[80vh]"
            >
              <button 
                onClick={() => setSelectedSupplierForHistory(null)}
                className="absolute top-6 right-6 p-2 bg-brand-bg rounded-xl text-brand-muted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="text-3xl font-serif text-brand-text mb-2 italic leading-tight">Order History</h3>
              <p className="text-brand-muted text-[10px] font-mono uppercase tracking-[0.2em] mb-8">
                {suppliers.find(s => s.id === selectedSupplierForHistory)?.company}
              </p>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                {purchaseOrders.filter(po => po.supplierId === selectedSupplierForHistory).length === 0 ? (
                  <div className="py-12 text-center">
                    <Package size={40} className="text-brand-muted/20 mx-auto mb-4" />
                    <p className="text-brand-muted font-mono text-[10px] uppercase">No Transaction Logs Found</p>
                  </div>
                ) : (
                  purchaseOrders
                    .filter(po => po.supplierId === selectedSupplierForHistory)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((po) => {
                      const product = inventory.find(p => p.id === po.productId);
                      return (
                        <div key={po.id} className="bg-brand-bg p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-brand-card flex items-center justify-center overflow-hidden">
                              {product ? (
                                <img src={product.image} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <Package size={20} className="text-brand-muted" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-brand-text mb-1">{po.id}</p>
                              <div className="flex items-center gap-2">
                                <Calendar size={10} className="text-brand-muted" />
                                <span className="text-[10px] font-mono text-brand-muted uppercase">{po.createdAt}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold font-mono text-brand-primary">${po.totalCost.toLocaleString()}</p>
                            <span className={`text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full ${
                              po.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                            }`}>
                              {po.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Purchase Order Modal */}
      <AnimatePresence>
        {selectedSupplierForPurchase && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-brand-card rounded-[2.5rem] border border-white/10 p-8 relative overflow-hidden"
            >
              <button 
                onClick={() => setSelectedSupplierForPurchase(null)}
                className="absolute top-6 right-6 p-2 bg-brand-bg rounded-xl text-brand-muted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="text-3xl font-serif text-brand-text mb-2 italic leading-tight">Stage Order</h3>
              <p className="text-brand-muted text-[10px] font-mono uppercase tracking-[0.2em] mb-8">
                Purchasing from {suppliers.find(s => s.id === selectedSupplierForPurchase)?.company}
              </p>

              <form onSubmit={handlePurchaseSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-mono text-brand-muted uppercase tracking-widest ml-1">Select Inventory Item</label>
                  <select 
                    required
                    value={purchaseData.productId}
                    onChange={(e) => {
                      const p = inventory.find(item => item.id === e.target.value);
                      setPurchaseData({
                        ...purchaseData, 
                        productId: e.target.value,
                        unitCost: p ? p.price * 0.4 : 0 // Assuming 40% of retail as cost
                      });
                    }}
                    className="w-full bg-brand-bg border border-white/5 rounded-xl py-4 px-6 text-brand-text text-xs font-mono outline-none focus:border-brand-primary/50 transition-all appearance-none"
                  >
                    <option value="">Select Product...</option>
                    {inventory.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (${p.price} Retail)</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-brand-muted uppercase tracking-widest ml-1">Quantity</label>
                    <input 
                      required
                      type="number" 
                      min="1"
                      placeholder="Qty" 
                      value={purchaseData.quantity}
                      onChange={(e) => setPurchaseData({...purchaseData, quantity: parseInt(e.target.value) || 0})}
                      className="w-full bg-brand-bg border border-white/5 rounded-xl py-4 px-6 text-brand-text text-xs font-mono outline-none focus:border-brand-primary/50 transition-all" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-brand-muted uppercase tracking-widest ml-1">Unit Cost ($)</label>
                    <input 
                      required
                      type="number" 
                      min="0"
                      step="0.01"
                      placeholder="Cost" 
                      value={purchaseData.unitCost}
                      onChange={(e) => setPurchaseData({...purchaseData, unitCost: parseFloat(e.target.value) || 0})}
                      className="w-full bg-brand-bg border border-white/5 rounded-xl py-4 px-6 text-brand-text text-xs font-mono outline-none focus:border-brand-primary/50 transition-all" 
                    />
                  </div>
                </div>

                <div className="bg-brand-primary/5 p-4 rounded-2xl border border-brand-primary/10 flex justify-between items-center">
                  <p className="text-[10px] font-mono text-brand-muted uppercase tracking-widest">Estimated Commitment</p>
                  <p className="text-lg font-bold font-mono text-brand-primary">
                    ${(purchaseData.quantity * purchaseData.unitCost).toLocaleString()}
                  </p>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-brand-primary text-black font-bold py-5 rounded-2xl mt-4 shadow-xl shadow-brand-primary/20 active:scale-95 transition-all font-mono text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> Finalize PO
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
