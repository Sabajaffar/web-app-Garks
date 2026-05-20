import { motion } from 'motion/react';
import { Shield, Lock, Eye, FileText, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col bg-brand-bg min-h-full">
      <header className="px-6 pt-12 pb-6 sticky top-0 bg-brand-bg/80 backdrop-blur-md z-10 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-brand-card rounded-2xl text-brand-muted">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-serif text-brand-text">Privacy Policy</h1>
      </header>

      <div className="px-8 py-4 space-y-8 pb-20">
        <div className="bg-brand-primary/10 border border-brand-primary/20 p-6 rounded-3xl flex items-center gap-4">
          <Shield className="text-brand-primary shrink-0" size={32} />
          <p className="text-xs text-brand-muted font-mono uppercase tracking-widest leading-relaxed">
            Your privacy is our priority. We use industry-standard encryption to protect your data.
          </p>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-brand-secondary">
            <Eye size={20} />
            <h3 className="text-lg font-serif">Data Collection</h3>
          </div>
          <p className="text-brand-muted text-sm leading-relaxed">
            We collect personal information that you provide to us, such as your name, address, contact information, passwords and security data, and payment information. All personal information that you provide to us must be true, complete and accurate.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-brand-secondary">
            <Lock size={20} />
            <h3 className="text-lg font-serif">Data Usage</h3>
          </div>
          <p className="text-brand-muted text-sm leading-relaxed">
            We process your information for purposes based on legitimate business interests, the fulfillment of our contract with you, compliance with our legal obligations, and/or your consent. This includes processing for AI-driven recommendations.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-brand-secondary">
            <FileText size={20} />
            <h3 className="text-lg font-serif">Third-party Sharing</h3>
          </div>
          <p className="text-brand-muted text-sm leading-relaxed">
            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We never sell your personal data to advertisers.
          </p>
        </section>

        <footer className="pt-8 border-t border-brand-muted/10 text-center">
          <p className="text-[10px] font-mono text-brand-muted uppercase tracking-[0.3em]">Last Updated: May 2026</p>
        </footer>
      </div>
    </div>
  );
}
