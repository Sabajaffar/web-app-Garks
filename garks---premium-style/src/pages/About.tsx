import { motion } from 'motion/react';
import { Info, Heart, Code2, Users, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

export default function About() {
  return (
    <div className="flex flex-col pb-12 bg-brand-bg min-h-screen">
      <PageHeader title="Atelier" subtitle="The GarKS Story" showBack />
      
      <div className="px-8 space-y-12 pt-8">
        <header className="space-y-6 text-center">
          <h2 className="text-5xl font-serif text-brand-text italic leading-tight">Style. Smart.<br />Simple.</h2>
          <div className="flex justify-center">
            <div className="h-[1px] w-20 bg-brand-primary/40" />
          </div>
          <p className="text-brand-muted text-xs font-mono uppercase tracking-[0.3em] leading-relaxed max-w-xs mx-auto">
            A premium garments experience engineered for the modern aesthetic.
          </p>
        </header>

        <section className="space-y-12">
          {/* Founders Section */}
          <div className="bg-brand-card/50 backdrop-blur-xl p-8 rounded-[3rem] border border-brand-primary/20 relative overflow-hidden text-center group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-brand-primary rounded-3xl shadow-xl shadow-brand-primary/20">
                <Code2 size={40} className="text-black" />
              </div>
            </div>
            <h3 className="text-2xl font-serif text-brand-text mb-4 italic underline decoration-brand-primary/30">The Visionaries</h3>
            <p className="text-brand-text text-sm leading-relaxed mb-6 font-serif">
              GarKS was founded by the architectural minds of <span className="text-brand-primary font-bold">Kulsoom Saeed</span> and <span className="text-brand-primary font-bold">Saba Jaffar</span>.
            </p>
            <p className="text-[10px] text-brand-muted font-mono uppercase tracking-widest leading-loose">
              Their mission was simple: To merge high-end fashion with seamless intelligent technology. What started as a shared passion for design evolved into a global standard for boutique luxury.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Founded', value: '2024', icon: Star },
              { label: 'Minds', value: '2', icon: Users },
            ].map((item, i) => (
              <div key={i} className="bg-brand-card p-6 rounded-[2rem] border border-white/5 flex flex-col items-center gap-2">
                <item.icon size={20} className="text-brand-primary/60 mb-2" />
                <p className="text-[8px] font-mono text-brand-muted uppercase tracking-widest">{item.label}</p>
                <h4 className="text-xl font-bold font-mono">{item.value}</h4>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-mono text-brand-muted uppercase tracking-[0.4em] text-center">Core Pillars</h3>
            <div className="space-y-4">
              <div className="bg-brand-card p-6 rounded-3xl border border-white/5 flex gap-5">
                <div className="p-3 bg-brand-bg rounded-2xl h-fit border border-white/10">
                  <Heart size={20} className="text-brand-secondary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-mono text-brand-text">Ethical Sourcing</h4>
                  <p className="text-[10px] text-brand-muted mt-1 leading-relaxed">We partner with master artisans across Pakistan and Europe to ensure every thread meets our excellence threshold.</p>
                </div>
              </div>
              <div className="bg-brand-card p-6 rounded-3xl border border-white/5 flex gap-5">
                <div className="p-3 bg-brand-bg rounded-2xl h-fit border border-white/10">
                  <Star size={20} className="text-brand-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-mono text-brand-text">Bespoke Intelligence</h4>
                  <p className="text-[10px] text-brand-muted mt-1 leading-relaxed">Our neural interface (Gargi) adapts to your style, ensuring your wardrobe is always a reflection of your best self.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="text-center pt-8 border-t border-white/5 space-y-4">
          <p className="text-[9px] font-mono text-brand-muted uppercase tracking-widest">GarKS Luxury Group • All Rights Reserved</p>
        </footer >
      </div>
    </div>
  );
}
