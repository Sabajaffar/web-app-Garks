import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, Zap, Info, Trash2, ArrowLeft } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';

export default function Notifications() {
  const { notifications, markNotificationsRead, clearNotifications } = useStore();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <PageHeader title="Notifications" subtitle="Updates for You" showBack />

      <div className="flex-1 px-6 pt-4 space-y-4 pb-32">
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-mono text-brand-muted uppercase tracking-widest">{notifications.length} recent events</span>
          <button 
            onClick={clearNotifications}
            className="text-[10px] font-mono text-red-400 uppercase tracking-widest flex items-center gap-1 hover:underline"
          >
            <Trash2 size={12} /> Clear All
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 flex flex-col items-center justify-center text-center gap-4 opacity-30"
              >
                <Bell size={64} className="text-brand-muted" />
                <p className="text-brand-muted font-serif italic text-lg px-8">All caught up! Exclusive drops and updates will appear here.</p>
              </motion.div>
            ) : (
              notifications.map((notif, idx) => (
                <motion.div 
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-5 rounded-3xl border transition-all ${
                    notif.read ? 'bg-brand-card/40 border-white/5 opacity-60' : 'bg-brand-card border-brand-primary/20 shadow-lg shadow-brand-primary/5'
                  } relative overflow-hidden`}
                >
                  {!notif.read && (
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-brand-primary text-black rounded-bl-2xl shadow-lg">
                      <Zap size={12} className="fill-current" />
                    </div>
                  )}
                  
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-2xl shrink-0 h-fit ${
                      notif.type === 'sale' ? 'bg-brand-secondary/20 text-brand-secondary' :
                      notif.type === 'order' ? 'bg-brand-primary/20 text-brand-primary' :
                      'bg-brand-card text-brand-muted'
                    }`}>
                      {notif.type === 'sale' ? <Zap size={18} /> : 
                       notif.type === 'order' ? <Check size={18} /> : 
                       <Info size={18} />}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-brand-text">{notif.title}</h4>
                      <p className="text-xs text-brand-muted leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] font-mono text-brand-muted/60 uppercase block pt-1">{notif.time}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {notifications.some(n => !n.read) && (
          <button 
            onClick={markNotificationsRead}
            className="w-full bg-brand-primary text-black font-bold py-5 rounded-2xl text-[10px] uppercase font-mono tracking-widest shadow-xl sticky bottom-24"
          >
            Mark all as read
          </button>
        )}
      </div>
    </div>
  );
}
