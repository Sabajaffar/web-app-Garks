import { motion } from 'motion/react';
import { Shield, Lock, Eye, FileText, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col pb-12 bg-brand-bg min-h-screen">
      <PageHeader title="Privacy" subtitle="Legal Framework" showBack />
      
      <div className="px-8 space-y-10 pt-8">
        <header className="space-y-4">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border border-brand-primary/20">
            <Shield size={32} />
          </div>
          <h2 className="text-4xl font-serif text-brand-text italic leading-tight">Your Data,<br />Our Integrity.</h2>
          <p className="text-brand-muted text-xs font-mono uppercase tracking-[0.2em] leading-relaxed">
            Privacy is not a feature; it is the foundation of GarKS Luxury.
          </p>
        </header>

        <section className="space-y-8">
          {[
            { 
              title: 'Data Collection', 
              icon: FileText, 
              desc: 'We collect minimal identity data (username, contact) essential for executive order fulfillment and neural profile customization.' 
            },
            { 
              title: 'Security Sync', 
              icon: Lock, 
              desc: 'Transactions are processed through GarKS Secured Node. We use bank-grade AES-256 encryption for all data at rest and in transit.' 
            },
            { 
              title: 'Transparency', 
              icon: Eye, 
              desc: 'You maintain absolute control. You can terminate your session, request data erasure, or download your style history at any moment.' 
            }
          ].map((item, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              key={i} 
              className="flex gap-6"
            >
              <div className="shrink-0 p-3 bg-brand-card rounded-xl h-fit border border-white/5">
                <item.icon size={20} className="text-brand-secondary" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold uppercase font-mono tracking-tighter">{item.title}</h4>
                <p className="text-[11px] text-brand-muted leading-relaxed italic">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </section>

        <div className="bg-brand-card p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
          <p className="text-[10px] text-brand-muted leading-loose italic font-serif">
            "By utilizing the GarKS platform, you acknowledge our commitment to ethical data stewardship. We do not sell your style patterns to third-party entities. Your elegance remains your own."
            <br /><br />
            Last Updated: May 2026
          </p>
        </div>
      </div>
    </div>
  );
}
