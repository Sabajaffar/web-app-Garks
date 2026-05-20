import { motion } from 'motion/react';
import { Package, Truck, Home, MapPin, ChevronLeft, Phone, MessageSquare } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';

export default function OrderTracking() {
  const { orders } = useStore();
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const order = orders.find(o => o.id === orderId) || orders[0];

  if (!order) return null;

  const steps = [
    { label: 'Order Placed', status: 'completed', icon: Package, time: '10:30 AM' },
    { label: 'Processing', status: 'completed', icon: Truck, time: '11:45 AM' },
    { label: 'On its Way', status: 'current', icon: MapPin, time: 'Now' },
    { label: 'Delivered', status: 'pending', icon: Home, time: 'Est. 4 PM' },
  ];

  return (
    <div className="flex flex-col pb-32">
      <div className="px-6 pt-12 pb-6">
        <button 
          onClick={() => navigate('/customer/orders')}
          className="p-3 bg-brand-card rounded-2xl text-brand-muted hover:text-white transition-colors mb-6"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-3xl font-serif">Track Order</h1>
        <p className="text-[10px] font-mono text-brand-muted uppercase tracking-widest mt-1">ID: {order.id}</p>
      </div>

      {/* Live Map Mock */}
      <section className="px-6 mb-8">
        <div className="relative h-60 w-full rounded-3xl overflow-hidden border border-white/5 bg-[#1a2b24]">
          <div className="absolute inset-0 opacity-40 grayscale contrast-125" 
            style={{ 
              backgroundImage: 'radial-gradient(circle at 50% 50%, #3fb950 0%, transparent 2%, transparent 100%), linear-gradient(#ffffff05 1px, transparent 1px), linear-gradient(90deg, #ffffff05 1px, transparent 1px)',
              backgroundSize: '100% 100%, 20px 20px, 20px 20px'
            }} 
          />
          {/* Pulsing Dot */}
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-1/2 left-1/3 w-4 h-4 bg-brand-primary rounded-full blur-[2px]"
          />
          <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-brand-primary rounded-full border-2 border-brand-bg shadow-2xl" />
          
          <div className="absolute bottom-4 left-4 right-4 bg-brand-card/90 backdrop-blur-xl p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center">
                <Truck className="text-brand-primary" size={20} />
              </div>
              <div>
                <p className="text-[8px] font-mono text-brand-muted uppercase tracking-widest">Delivery Partner</p>
                <p className="text-sm font-bold">Ahmed S.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 bg-brand-bg text-brand-primary rounded-xl"><Phone size={16} /></button>
              <button className="p-2 bg-brand-bg text-brand-primary rounded-xl"><MessageSquare size={16} /></button>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="px-10">
        <div className="relative border-l-2 border-brand-muted/20 space-y-12">
          {steps.map((step, i) => (
            <div key={i} className="relative pl-8">
              <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-brand-bg flex items-center justify-center ${
                step.status === 'completed' ? 'bg-brand-primary text-black' : 
                step.status === 'current' ? 'bg-brand-bg border-brand-primary animate-pulse' : 'bg-brand-card border-brand-muted/30'
              }`}>
                {step.status === 'completed' && <Package size={8} />}
              </div>
              
              <div className="flex justify-between items-start">
                <div>
                  <h4 className={`text-sm font-bold ${step.status === 'pending' ? 'text-brand-muted' : 'text-brand-text'}`}>
                    {step.label}
                  </h4>
                  <p className="text-[10px] text-brand-muted font-mono mt-1">Gargi Warehouse Hub, KHI</p>
                </div>
                <span className="text-[10px] font-mono text-brand-muted">{step.time}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="p-6 mt-8">
        <button 
          onClick={() => navigate('/customer/home')}
          className="w-full bg-brand-card border border-white/5 text-brand-muted font-bold py-4 rounded-3xl text-xs font-mono uppercase tracking-widest hover:text-white transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
