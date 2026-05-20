import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Check, ShoppingBag, Zap, Info, BellOff } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function NotificationCenter({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { notifications, markNotificationsRead, notificationsMuted, toggleMuteNotifications } = useStore();
  
  const handleClose = () => {
    markNotificationsRead();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 w-[85%] max-w-[360px] h-full bg-brand-bg border-l border-brand-muted/10 z-[70] flex flex-col"
          >
            <header className="p-8 flex items-center justify-between border-b border-white/5">
              <div className="flex flex-col">
                <h3 className="text-2xl font-serif text-brand-text">Notifications</h3>
                <span className="text-[10px] font-mono text-brand-muted uppercase tracking-widest mt-1">Updates for You</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleMuteNotifications} 
                  className={`p-3 rounded-2xl transition-colors ${notificationsMuted ? 'bg-red-500/20 text-red-500' : 'bg-brand-card text-brand-muted'}`}
                >
                  {notificationsMuted ? <BellOff size={20} /> : <Bell size={20} />}
                </button>
                <button onClick={handleClose} className="p-3 bg-brand-card rounded-2xl">
                  <X size={20} className="text-brand-muted" />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-4">
                  <Bell className="text-brand-muted/20" size={60} />
                  <p className="text-brand-muted font-serif italic text-lg px-4">No recent activity. Check back soon for exclusive drops!</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-5 rounded-3xl border ${notif.read ? 'bg-brand-card/40 border-white/5' : 'bg-brand-card border-brand-primary/20 shadow-lg shadow-brand-primary/5'} relative overflow-hidden`}
                  >
                    {!notif.read && <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-brand-primary text-black rounded-bl-2xl">
                      <Zap size={12} className="fill-current" />
                    </div>}
                    
                    <div className="flex gap-4">
                      <div className={`p-3 rounded-2xl shrink-0 h-fit ${
                        notif.type === 'sale' ? 'bg-brand-secondary/20 text-brand-secondary' :
                        notif.type === 'order' ? 'bg-brand-primary/20 text-brand-primary' :
                        'bg-brand-bg text-brand-muted'
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
                  </div>
                ))
              )}
            </div>

            <footer className="p-6">
              <button 
                onClick={handleClose}
                className="w-full bg-brand-primary text-black font-bold py-5 rounded-2xl text-[10px] uppercase font-mono tracking-widest shadow-xl"
              >
                Mark all as read
              </button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
