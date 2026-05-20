import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, ShoppingBag, BrainCircuit } from 'lucide-react';
import { useStore } from '../store/useStore';

const SLIDES = [
  {
    title: "Welcome to GarKS",
    subtitle: "Premium Fashion",
    description: "Discover a curated collection of high-end garments designed for the modern individual.",
    icon: ShoppingBag,
    color: "#3fb950"
  },
  {
    title: "Define Your Style",
    subtitle: "Smart. Simple.",
    description: "Experience effortless shopping with styles that define you. Quality meets elegance.",
    icon: Sparkles,
    color: "#d4a373"
  },
  {
    title: "Powered by Gargi",
    subtitle: "Intelligent AI",
    description: "The fashion assistant that understands your taste and keeps the store running smoothly.",
    icon: BrainCircuit,
    color: "#ffffff"
  }
];

export default function Splash() {
  const [current, setCurrent] = useState(0);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const navigate = useNavigate();
  const { setMode } = useStore();

  const handleNext = () => {
    if (current < SLIDES.length - 1) {
      setCurrent(current + 1);
    } else {
      navigate('/login');
    }
  };

  const handleSkip = () => {
    navigate('/login');
  };

  return (
    <div className="flex-1 flex flex-col relative bg-brand-bg">
      {/* Skip Button */}
      {current < SLIDES.length - 1 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleSkip}
          className="absolute top-12 right-8 z-50 text-brand-muted text-[10px] font-mono uppercase tracking-[0.3em] py-2 px-4 border border-white/5 rounded-full hover:border-brand-primary/30 transition-all"
        >
          Skip
        </motion.button>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex-1 flex flex-col items-center justify-center px-12 text-center"
        >
          <div 
            className="w-32 h-32 rounded-full mb-12 flex items-center justify-center shadow-xl"
            style={{ backgroundColor: `${SLIDES[current].color}20`, border: `1px solid ${SLIDES[current].color}40` }}
          >
            {(() => {
              const Icon = SLIDES[current].icon;
              return <Icon size={48} style={{ color: SLIDES[current].color }} />;
            })()}
          </div>
          
          <h1 className="text-4xl font-serif mb-2 text-brand-text tracking-tight">
            {SLIDES[current].title}
          </h1>
          <h2 className="text-brand-secondary font-mono text-xs uppercase tracking-widest mb-6">
            {SLIDES[current].subtitle}
          </h2>
          <p className="text-brand-muted text-sm leading-relaxed max-w-xs">
            {SLIDES[current].description}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-12 left-0 right-0 px-12 flex flex-col items-center gap-8">
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-brand-primary' : 'w-2 bg-brand-card'}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full bg-brand-primary text-black font-bold py-5 rounded-2xl flex items-center justify-center gap-2 group active:scale-95 transition-all shadow-lg hover:shadow-brand-primary/20"
        >
          <span>{current === SLIDES.length - 1 ? 'Get Started' : 'Next'}</span>
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
