import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, Plus, Target, Users, 
  BarChart, Zap, Share2, MoreVertical,
  Mail, MessageSquare, Instagram, X, CheckSquare
} from 'lucide-react';
import { useStore, Campaign } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { haptic } from '../../lib/utils';

export default function Marketing() {
  const { campaigns, addCampaign } = useStore();
  const navigate = useNavigate();
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Instagram' as Campaign['type'],
    reach: '0'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    haptic('medium');
    
    const colors = {
      Instagram: '#ec4899',
      Email: '#3fb950',
      SMS: '#fbbf24',
      Web: '#6366f1'
    };

    const newCampaign: Campaign = {
      id: `C-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      name: formData.name,
      status: 'Draft',
      reach: formData.reach,
      ctr: '0%',
      type: formData.type,
      icon: formData.type,
      color: colors[formData.type]
    };

    addCampaign(newCampaign);
    setShowAddCampaign(false);
    setFormData({ name: '', type: 'Instagram', reach: '0' });
    useStore.getState().setToast("Campaign Draft Created");
  };

  return (
    <div className="flex flex-col px-6 pt-8 pb-8 gap-8 w-full">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-brand-text">Marketing</h1>
          <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mt-1">Growth & Influence</p>
        </div>
        <button 
          onClick={() => {
            haptic('light');
            setShowAddCampaign(true);
          }}
          className="p-3 bg-brand-primary text-black rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Target Audience Overview */}
      <section className="bg-brand-card p-6 rounded-[2rem] border border-brand-muted/10 grid grid-cols-2 gap-8 shrink-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-brand-primary" />
            <span className="text-[10px] font-bold font-mono text-brand-primary uppercase tracking-[0.2em]">Target Reach</span>
          </div>
          <h4 className="text-3xl font-bold font-mono">24.8k</h4>
          <p className="text-[8px] text-brand-muted uppercase font-mono tracking-widest">Active Segments</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-brand-secondary" />
            <span className="text-[10px] font-bold font-mono text-brand-secondary uppercase tracking-[0.2em]">Acquisition</span>
          </div>
          <h4 className="text-3xl font-bold font-mono">+12%</h4>
          <p className="text-[8px] text-brand-muted uppercase font-mono tracking-widest">MoM Growth</p>
        </div>
      </section>

      {/* Campaign List */}
      <div className="space-y-4">
        <h3 className="font-serif text-xl px-2">Campaign Flow</h3>
        <div className="space-y-3">
          {campaigns.map((camp, i) => {
            const Icon = camp.type === 'Instagram' ? Instagram : camp.type === 'Email' ? Mail : camp.type === 'SMS' ? MessageSquare : Megaphone;
            return (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                key={camp.id}
                className="bg-brand-card p-5 rounded-3xl border border-white/5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${camp.color}15`, border: `1px solid ${camp.color}30` }}
                  >
                    <Icon size={20} style={{ color: camp.color }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-text mb-1">{camp.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${
                        camp.status === 'Active' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-muted/10 text-brand-muted'
                      }`}>
                        {camp.status}
                      </span>
                      <span className="text-[10px] font-mono text-brand-muted">{camp.reach} Reach</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[8px] font-mono text-brand-muted uppercase">CTR</span>
                    <span className="text-sm font-bold font-mono text-brand-primary">{camp.ctr}</span>
                  </div>
                  <button className="p-2 text-brand-muted group-hover:text-white transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* AI AI Marketing Tool */}
      <section className="bg-brand-bg border border-brand-primary/30 p-8 rounded-[3rem] text-center gap-6 flex flex-col items-center relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-full bg-brand-primary/5 opacity-50 blur-[60px]" />
        <div className="relative space-y-4">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Zap size={32} className="text-brand-primary" />
          </div>
          <h3 className="text-2xl font-serif text-brand-text leading-tight">Create Smart<br />Segments</h3>
          <p className="text-brand-muted text-xs leading-relaxed">
            Let Gargi analyze previous purchase history to identify high-intent VIP customers for your next collection.
          </p>
          <button 
            onClick={() => navigate('/admin/ai')}
            className="bg-brand-primary text-black font-bold px-10 py-4 rounded-2xl text-xs uppercase tracking-widest font-mono shadow-[0_10px_30px_#3fb95030] active:scale-95 transition-all"
          >
            Open AI Lab
          </button>
        </div>
      </section>

      {/* Add Campaign Modal */}
      <AnimatePresence>
        {showAddCampaign && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-brand-card rounded-[2.5rem] border border-white/10 p-8 relative overflow-hidden"
            >
              <button 
                onClick={() => setShowAddCampaign(false)}
                className="absolute top-6 right-6 p-2 bg-brand-bg rounded-xl text-brand-muted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="text-3xl font-serif text-brand-text mb-2 italic leading-tight">New Broadcast</h3>
              <p className="text-brand-muted text-[10px] font-mono uppercase tracking-[0.2em] mb-8">Define your outreach strategy</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[8px] font-mono text-brand-muted uppercase tracking-widest ml-1">Campaign Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Winter Luxury Drop" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-brand-bg border border-white/5 rounded-xl py-4 px-6 text-brand-text text-sm font-mono outline-none focus:border-brand-primary/50 transition-all" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-mono text-brand-muted uppercase tracking-widest ml-1">Channel</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Instagram', 'Email', 'SMS', 'Web'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, type: type as Campaign['type']})}
                        className={`py-3 rounded-xl border font-mono text-[10px] uppercase tracking-widest transition-all ${
                          formData.type === type 
                            ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' 
                            : 'bg-brand-bg border-white/5 text-brand-muted'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-mono text-brand-muted uppercase tracking-widest ml-1">Initial Target Reach</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. 15k" 
                    value={formData.reach}
                    onChange={(e) => setFormData({...formData, reach: e.target.value})}
                    className="w-full bg-brand-bg border border-white/5 rounded-xl py-4 px-6 text-brand-text text-sm font-mono outline-none focus:border-brand-primary/50 transition-all" 
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-brand-primary text-black font-bold py-5 rounded-2xl mt-4 shadow-xl shadow-brand-primary/20 active:scale-95 transition-all font-mono text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <CheckSquare size={16} /> Deploy Campaign
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
