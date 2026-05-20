import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, X, Clock, Trash2, Megaphone, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function TopBanner() {
  const navigate = useNavigate();
  const { saleActive, saleBannerDismissed, setSaleBannerDismissed, endSale, launchSale, saleDiscount } = useStore();
  const [show, setShow] = useState(false);
  const [showMiniMenu, setShowMiniMenu] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignType, setCampaignType] = useState('Send promotional push notification to customers');
  const [targetAudience, setTargetAudience] = useState('Wishlist Customers');
  const [estimatedReach, setEstimatedReach] = useState('1,200 users');
  const [campaignExecuted, setCampaignExecuted] = useState(false);

  useEffect(() => {
    if (saleActive && !saleBannerDismissed) {
      setShow(true);
    } else {
      setShow(false);
      setShowMiniMenu(false);
    }
  }, [saleActive, saleBannerDismissed]);

  useEffect(() => {
    if (targetAudience === 'Wishlist Customers') setEstimatedReach('1,200 users');
    else if (targetAudience === 'All Customers') setEstimatedReach('10,900 users');
    else if (targetAudience === 'Inactive Shoppers') setEstimatedReach('3,450 users');
    else if (targetAudience === 'Repeat Buyers') setEstimatedReach('2,100 users');
  }, [targetAudience]);

  const handleDismiss = () => setSaleBannerDismissed(true);
  const extendSale = () => { launchSale(saleDiscount, 12); setShowMiniMenu(false); };
  const handleEndSale = () => { endSale(); setShowMiniMenu(false); };

  const handleExecuteCampaign = async () => {
    try {
      await fetch('/api/orchestrator/approve-marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignType, targetAudience, estimatedReach })
      });
    } catch (_) { /* continue even if server fails */ }
    setShowCampaignModal(false);
    setCampaignExecuted(true);
    setTimeout(() => {
      setCampaignExecuted(false);
      navigate('/admin/ai', { state: { showCampaignResult: true, campaignType, targetAudience, estimatedReach } });
    }, 2000);
  };

  return (
    <>
      {/* Flash Sale Top Banner */}
      <AnimatePresence>
        {show && (
          <motion.div
            drag="y"
            dragConstraints={{ top: -50, bottom: 50 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => { if (Math.abs(info.offset.y) > 30) handleDismiss(); }}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-12 left-6 right-6 z-[100] cursor-grab active:cursor-grabbing"
          >
            <div className="bg-brand-primary text-black p-4 rounded-2xl shadow-[0_10px_30px_rgba(63,185,80,0.3)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 pointer-events-none">
                <div className="p-2 bg-black/10 rounded-xl shrink-0">
                  <Zap size={20} className="fill-current" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[10px] font-bold uppercase font-mono tracking-widest leading-none mb-1">Active Flash Sale</h4>
                  <p className="text-xs font-bold leading-tight truncate">Swipe up/down to minimize</p>
                </div>
              </div>
              <button onClick={handleDismiss} className="p-2 hover:bg-black/10 rounded-lg transition-colors shrink-0">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Minimized Icon */}
      <AnimatePresence>
        {saleActive && saleBannerDismissed && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-16 right-6 z-[100]"
          >
            <div className="relative">
              <button
                onClick={() => setShowMiniMenu(!showMiniMenu)}
                className="p-3 bg-brand-primary text-black rounded-full shadow-[0_0_20px_#3fb950] hover:scale-110 transition-transform flex items-center justify-center"
              >
                <Zap size={20} className="fill-current animate-pulse" />
              </button>

              <AnimatePresence>
                {showMiniMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute top-14 right-0 w-52 bg-brand-card border border-brand-primary/20 rounded-2xl p-2 shadow-xl flex flex-col gap-1 backdrop-blur-xl"
                  >
                    <button onClick={() => { setSaleBannerDismissed(false); setShowMiniMenu(false); }} className="px-3 py-2 text-left text-xs text-brand-text hover:bg-white/5 rounded-xl transition-colors font-medium flex items-center gap-2">
                      <Zap size={14} className="text-brand-primary" /> Maximize Banner
                    </button>
                    <button onClick={extendSale} className="px-3 py-2 text-left text-xs text-brand-text hover:bg-white/5 rounded-xl transition-colors font-medium flex items-center gap-2">
                      <Clock size={14} className="text-brand-muted" /> Extend +12h
                    </button>
                    <button onClick={() => { setShowCampaignModal(true); setShowMiniMenu(false); }} className="px-3 py-2 text-left text-xs text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-colors font-bold flex items-center gap-2">
                      <Megaphone size={14} className="text-brand-primary" /> Launch Campaign
                    </button>
                    <div className="h-[1px] w-full bg-white/5 my-1" />
                    <button onClick={handleEndSale} className="px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-bold flex items-center gap-2">
                      <Trash2 size={14} /> End Sale
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Marketing Campaign Modal */}
      <AnimatePresence>
        {showCampaignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-[200] px-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-card border border-brand-primary/30 p-8 rounded-[2.5rem] shadow-[0_0_60px_rgba(63,185,80,0.15)] w-full max-w-sm space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Megaphone size={28} className="text-brand-primary" />
                </div>
                <h4 className="text-xl font-serif italic text-brand-text">Agent recommends Marketing Campaign</h4>
                <p className="text-[10px] font-mono text-brand-muted uppercase tracking-widest">Sale active · multi-channel boost</p>
              </div>

              {/* Agent note */}
              <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl text-left space-y-1">
                <p className="text-[9px] font-mono text-brand-primary uppercase font-bold tracking-wider">Agent Recommendation</p>
                <p className="text-xs text-brand-text font-serif italic leading-relaxed">
                  "Active sale detected. Initiating multi-channel marketing campaign to highlight low-stock items and wishlist products without duplicate discounting."
                </p>
              </div>

              {/* Controls */}
              <div className="space-y-4 border-t border-b border-white/5 py-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono text-brand-muted uppercase tracking-wider">Campaign Type</label>
                  <select
                    value={campaignType}
                    onChange={e => setCampaignType(e.target.value)}
                    className="bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-primary w-full font-serif italic"
                  >
                    <option value="Send promotional push notification to customers">Send promotional push notification</option>
                    <option value="Highlight low-stock items as 'Almost Gone!'">Highlight low-stock: "Almost Gone!"</option>
                    <option value="Create urgency banner: 'Only X units left!'">Urgency banner: "Only X units left!"</option>
                    <option value="Email campaign to wishlist customers">Email wishlist customers</option>
                    <option value="Boost social media visibility">Boost social media visibility</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono text-brand-muted uppercase tracking-wider">Target Audience</label>
                  <select
                    value={targetAudience}
                    onChange={e => setTargetAudience(e.target.value)}
                    className="bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-primary w-full font-serif italic"
                  >
                    <option value="Wishlist Customers">Wishlist Customers</option>
                    <option value="All Customers">All Customers</option>
                    <option value="Inactive Shoppers">Inactive Shoppers</option>
                    <option value="Repeat Buyers">Repeat Buyers</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono text-brand-muted uppercase tracking-wider">Estimated Reach</label>
                  <div className="bg-brand-bg/50 border border-brand-primary/20 rounded-xl px-3 py-2.5 text-xs font-mono text-brand-primary font-bold text-center">
                    {estimatedReach}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleExecuteCampaign}
                  className="w-full bg-brand-primary text-black font-bold py-4 rounded-2xl font-mono text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Megaphone size={16} /> Approve & Launch Campaign
                </button>
                <button
                  onClick={() => setShowCampaignModal(false)}
                  className="w-full bg-brand-bg text-brand-muted py-4 rounded-2xl font-mono text-[10px] uppercase tracking-widest border border-white/5 active:scale-95 transition-transform"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign Executed Overlay */}
      <AnimatePresence>
        {campaignExecuted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-4"
            >
              <CheckCircle2 size={56} className="text-brand-primary mx-auto animate-pulse" />
              <h3 className="text-xl font-serif italic text-brand-text">Campaign Deployed!</h3>
              <p className="text-xs text-brand-muted font-mono uppercase tracking-widest">Redirecting to AI Intelligence...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
