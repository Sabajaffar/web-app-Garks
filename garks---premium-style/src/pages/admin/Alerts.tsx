import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, AlertTriangle, Info, 
  Trash2, CheckCircle2, Search,
  Zap, Package, ShoppingBag, User
} from 'lucide-react';
import { useState } from 'react';

const ALERTS = [
  { id: 1, type: 'critical', title: 'Critical Stock Level', msg: 'Vintage Leather Jacket (SKU: VLJ-BLK-M) is now out of stock.', time: '2 mins ago', icon: Package },
  { id: 2, type: 'high', title: 'New VIP Registration', msg: 'Elite customer Alex Vance has joined the platform.', time: '14 mins ago', icon: User },
  { id: 3, type: 'info', title: 'Insight Available', msg: 'Gargi has detected a new trend in "Polo Shirts" search queries.', time: '1 hr ago', icon: Zap },
  { id: 4, type: 'low', title: 'System Healthy', msg: 'All store monitoring cameras are operational and syncing.', time: '4 hrs ago', icon: CheckCircle2 },
];

export default function Alerts() {
  const [alerts, setAlerts] = useState(ALERTS);

  const removeAlert = (id: number) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="flex flex-col px-6 pt-8 pb-12 gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-brand-text">Alerts Centre</h1>
          <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mt-1">Operational Intelligence</p>
        </div>
        <div className="p-3 bg-brand-card rounded-2xl border border-brand-muted/10 text-brand-muted">
          <Bell size={20} />
        </div>
      </header>

      {/* Alert Filter/Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
        <input 
          type="text" 
          placeholder="Filter notifications..." 
          className="w-full bg-brand-card border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-brand-text focus:border-brand-primary outline-none transition-all font-mono text-sm"
        />
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert) => (
            <motion.div 
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={alert.id}
              className={`p-6 rounded-[2.5rem] border ${
                alert.type === 'critical' ? 'bg-red-400/10 border-red-500/20' : 
                alert.type === 'high' ? 'bg-brand-primary/10 border-brand-primary/20' :
                'bg-brand-card border-white/5'
              } relative overflow-hidden group`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  alert.type === 'critical' ? 'bg-red-500/20 text-red-500' : 
                  alert.type === 'high' ? 'bg-brand-primary/20 text-brand-primary' :
                  'bg-brand-bg text-brand-muted'
                }`}>
                  <alert.icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-serif text-lg ${
                      alert.type === 'critical' ? 'text-red-400' : 'text-brand-text'
                    }`}>{alert.title}</h4>
                    <span className="text-[8px] font-mono text-brand-muted uppercase tracking-widest">{alert.time}</span>
                  </div>
                  <p className="text-xs text-brand-muted leading-relaxed pr-4">
                    {alert.msg}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => removeAlert(alert.id)}
                className="absolute top-6 right-6 p-2 text-brand-muted opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all rounded-full hover:bg-white/5"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {alerts.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-4">
            <CheckCircle2 className="text-brand-primary/20" size={64} />
            <p className="text-brand-muted font-serif italic text-lg px-8">Inbox Zero. Your store is running at peak efficiency.</p>
          </div>
        )}
      </div>

      {alerts.length > 0 && (
        <button 
          onClick={() => setAlerts([])}
          className="w-full py-4 text-brand-muted text-[10px] font-mono uppercase tracking-[0.3em] hover:text-brand-primary transition-colors mt-4"
        >
          Clear All Notifications
        </button>
      )}
    </div>
  );
}
