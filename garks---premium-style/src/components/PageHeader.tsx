import { Bell, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { motion } from 'motion/react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, showBack, rightElement }: PageHeaderProps) {
  const navigate = useNavigate();
  const { notifications, mode } = useStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-brand-bg/80 backdrop-blur-md z-40">
      <div className="flex items-center gap-4">
        {showBack && (
          <button 
            onClick={() => navigate(-1)} 
            className="p-3 bg-brand-card rounded-2xl text-brand-muted hover:text-brand-primary transition-colors shadow-lg"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="flex flex-col">
          {subtitle && <span className="text-brand-muted text-[10px] font-mono uppercase tracking-widest leading-none mb-1">{subtitle}</span>}
          <h2 className="text-xl font-serif text-brand-text leading-none">{title}</h2>
        </div>
      </div>
      
      {rightElement ? rightElement : (
        mode !== 'admin' && (
          <button 
            onClick={() => navigate('/customer/notifications')}
            className="p-2.5 bg-brand-card rounded-xl text-brand-muted hover:text-brand-primary transition-colors relative"
          >
            {unreadCount > 0 && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-primary rounded-full animate-pulse shadow-[0_0_8px_#3fb950]" 
              />
            )}
            <Bell size={20} />
          </button>
        )
      )}
    </header>
  );
}
