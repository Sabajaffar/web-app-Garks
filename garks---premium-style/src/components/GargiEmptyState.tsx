import { motion } from 'motion/react';
import { BrainCircuit, Sparkles } from 'lucide-react';

interface GargiEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function GargiEmptyState({ title, description, actionLabel, onAction }: GargiEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center gap-8 min-h-[400px]">
      <div className="relative group">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 border border-dashed border-brand-primary/20 rounded-full scale-150" 
        />
        <div className="w-40 h-40 bg-brand-primary/5 rounded-[3rem] flex items-center justify-center relative overflow-hidden border border-brand-primary/20 bg-gradient-to-br from-brand-primary/10 to-transparent shadow-2xl">
          <BrainCircuit size={80} className="text-brand-primary/40 animate-pulse" />
          <motion.div 
            animate={{ y: [-10, 10, -10], x: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-8 right-8"
          >
            <Sparkles size={24} className="text-brand-secondary/60" />
          </motion.div>
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="text-2xl font-serif italic text-brand-text leading-tight">{title}</h3>
        <p className="text-[10px] text-brand-muted font-mono uppercase tracking-[0.2em] leading-relaxed max-w-xs">{description}</p>
      </div>

      {actionLabel && (
        <button 
          onClick={onAction}
          className="bg-brand-primary text-black font-mono text-[10px] uppercase tracking-[0.3em] font-bold px-10 py-5 rounded-2xl active:scale-95 transition-all shadow-xl shadow-brand-primary/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
