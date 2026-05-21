import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Mic, BrainCircuit, Sparkles, MicOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useStore } from '../store/useStore';

function VoiceVisualizer({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center gap-1 h-8 px-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <motion.div
          key={i}
          animate={isActive ? {
            height: [4, 16, 8, 20, 4][Math.floor(Math.random() * 5)],
          } : { height: 4 }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            repeatType: "mirror",
            delay: i * 0.05
          }}
          className="w-1 bg-brand-primary rounded-full"
        />
      ))}
    </div>
  );
}

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  isAgentResult?: boolean;
  agentData?: {
    workplan?: string;
    insights?: string[];
    risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    contradictions?: string[];
    sale_recommended?: boolean;
    recommended_discount?: number;
    recommended_duration?: number;
    before_state?: {
      inventory_status?: string;
      active_discounts?: string;
    };
    action_chain?: any[];
  };
  // UI flags for recommendations
  showApprovalButtons?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'declined';
  isLogsDisplay?: boolean;
  logs?: any[];
  isRestockRecommendation?: boolean;
  restockCategory?: string;
  isSaleRecommendation?: boolean; // legacy flag
  isFlashSaleRecommendation?: boolean; // explicit flash‑sale flag
  isMarketingRecommendation?: boolean;
  marketingTip?: string;
  isPerformanceReport?: boolean;
  performanceSummary?: string;
}



export default function GargiAssistant() {
  const {
    user,
    mode,
    gargiOpen,
    setGargiOpen,
    inventory,
    saleRecommendedByAI,
    orderedCategories,
    orderRestock,
    cancelRestock
  } = useStore();

  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: `✨ Welcome to the **GarKS Luxury Concierge**.\n💼 I am your private advisor for inventory, pricing, and retail strategy.\n👑 How may I elevate your retail operations today?`
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Pulsing alert badge state
  const lowStockCount = inventory.filter(p => p.stock < 5).length;
  const hasBadge = lowStockCount > 0 || saleRecommendedByAI;

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        setMessage("Show me some elegant evening wear.");
      }, 2500);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (gargiOpen) scrollToBottom();
  }, [history, gargiOpen]);

  // Dynamic AI Recommendation based on real store data
  useEffect(() => {
    if (!gargiOpen) return;
    const fetchData = async () => {
      try {
        const [storeRes, salesRes] = await Promise.all([
          fetch('http://localhost:3001/store_state'),
          fetch('http://localhost:3001/sales_dashboard')
        ]);
        const storeState = await storeRes.json();
        const salesDashboard = await salesRes.json();

        // Determine recommendation
        let recommendation = null;
        if (storeState.stockoutRisk === 'HIGH' || storeState.stockout_risk === 'HIGH') {
          // Identify product to reorder, defaulting to a generic name
          const productToReorder = storeState.product || 'inventory';
          recommendation = {
            type: 'restock',
            text: `⚠️ **Critical:** Reorder ${productToReorder} immediately.\nEstimated stockout in 2 days.`,
            theme: 'restock',
            isRestockRecommendation: true,
            restockCategory: storeState.product_category || productToReorder,
            marketingTip: '',
            performanceSummary: ''
          };
        } else if (storeState.saleActive && (storeState.revenueChange < 0 || salesDashboard.revenue_trending === 'negative')) {
          recommendation = {
            type: 'marketing',
            text: `📈 **Marketing Boost**: Increase weightage of existing growth tab schemes and add a new scheme with allocated budget.`,
            theme: 'marketing',
            isMarketingRecommendation: true,
            marketingTip: `Increase weightage of existing growth tab schemes and add a new scheme with allocated budget.`,
            performanceSummary: ''
          };
        } else if (!storeState.saleActive && ((storeState.revenueChange && storeState.revenueChange <= -20) || (salesDashboard.revenue_drop_percent && salesDashboard.revenue_drop_percent > 20))) {
          const dropAmount = Math.abs(storeState.revenueChange || salesDashboard.revenue_drop_percent || 30);
          recommendation = {
            type: 'flash',
            text: `🚀 **Flash Sale Advisable**: Revenue down ${dropAmount}% – launching flash sale is recommended.`,
            theme: 'flash',
            isFlashSaleRecommendation: true,
            showApprovalButtons: true,
            approvalStatus: 'pending',
            agentData: {
              recommended_discount: salesDashboard.suggested_discount || 30,
              recommended_duration: salesDashboard.suggested_duration || 4
            },
            marketingTip: '',
            performanceSummary: ''
          };
        } else {
          recommendation = {
            type: 'positive',
            text: `✅ Store performing well. No action needed.`,
            theme: 'positive',
            isPerformanceReport: true,
            performanceSummary: `Store is performing well with stable revenue and inventory levels.`,
            marketingTip: '',
            showApprovalButtons: false
          };
        }

        // Append recommendation to chat history if not already shown for this session
        setHistory(prev => {
          const already = prev.some(msg => msg.role === 'ai' && msg.text === recommendation.text);
          if (already) return prev;
          return [...prev, { role: 'ai', ...recommendation }];
        });
      } catch (err) {
        console.error('Failed to fetch store data', err);
      }
    };
    fetchData();
  }, [gargiOpen, inventory]);


  const executeSend = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    setHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const lowerMsg = userMessage.toLowerCase();
      const isSalesOrInventoryQuery = lowerMsg.includes('sale') || lowerMsg.includes('inventory') || lowerMsg.includes('stock') || lowerMsg.includes('revenue') || lowerMsg.includes('kpi') || lowerMsg.includes('clearance');
      const isLogsQuery = lowerMsg.includes('log') || lowerMsg.includes('trace');

      let agentData = null;
      let logsData = null;

      if (isSalesOrInventoryQuery) {
        setHistory(prev => [...prev, { role: 'ai', text: "🔄 *Checking live sources...*" }]);
        const agentRes = await fetch('/api/agent/run', { method: 'POST' });
        agentData = await agentRes.json();
        // Remove loader
        setHistory(prev => prev.filter(msg => !msg.text?.includes("Checking live sources")));
      } else if (isLogsQuery) {
        const logsRes = await fetch('/api/agent/logs');
        logsData = await logsRes.json();
      }

      const response = await fetch('/api/gargi/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          isAdmin: mode === 'admin',
          context: {
            userName: user?.name,
            currentView: mode,
            agentAnalysis: agentData,
            recentLogs: logsData
          }
        })
      });
      const data = await response.json();

      const updatedMessage: ChatMessage = {
        role: 'ai',
        text: data.text,
        isAgentResult: !!agentData,
        agentData: agentData ? {
          workplan: agentData.workplan,
          insights: agentData.insights,
          risk_level: agentData.risk_level,
          contradictions: agentData.contradictions,
          sale_recommended: agentData.sale_recommended,
          recommended_discount: agentData.recommended_discount,
          recommended_duration: agentData.recommended_duration,
          action_chain: agentData.action_chain
        } : undefined,
        showApprovalButtons: agentData?.sale_recommended,
        approvalStatus: agentData?.sale_recommended ? 'pending' : undefined,
        isLogsDisplay: !!logsData,
        logs: logsData
      };

      setHistory(prev => [...prev, updatedMessage]);
    } catch (error) {
      setHistory(prev => [...prev, { role: 'ai', text: "I'm momentarily unavailable to assist. Please try again in a moment." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    const userMessage = message;
    setMessage('');
    await executeSend(userMessage);
  };

  const handleQuickAction = async (actionType: string) => {
    let actionQuery = '';
    if (actionType === 'Run Agent Analysis') {
      actionQuery = 'Run autonomous agent analysis';
    } else if (actionType === 'Check Stock Levels') {
      actionQuery = 'Check stock levels';
    } else if (actionType === 'View Agent Logs') {
      actionQuery = 'View agent logs';
    }
    await executeSend(actionQuery);
  };

  const handleInlineApprove = async (index: number) => {
    const msg = history[index];
    if (!msg.agentData) return;

    try {
      const discount = msg.agentData.recommended_discount || 20;
      const duration = msg.agentData.recommended_duration || 4;

      const res = await fetch('/api/agent/execute-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount, duration })
      });
      const data = await res.json();
      if (data.success) {
        useStore.getState().launchSale(discount, duration);

        try {
          const { sendSaleStartEmail } = await import('../services/emailService');
          sendSaleStartEmail(discount, duration);
        } catch (emailErr) {
          console.error("Failed to send start sale email:", emailErr);
        }

        setHistory(prev => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            approvalStatus: 'approved'
          };
          return next;
        });
      }
    } catch (err) {
      console.error("Inline sale execution failed:", err);
    }
  };

  const handleInlineDecline = (index: number) => {
    setHistory(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        approvalStatus: 'declined'
      };
      return next;
    });
  };

  return (
    <>
      <div className="fixed bottom-36 right-6 md:right-8 z-[100] pointer-events-none">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setGargiOpen(true)}
          className="w-12 h-12 bg-brand-card/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center shadow-2xl relative group pointer-events-auto"
        >
          <div className="absolute inset-0 bg-brand-primary opacity-0 group-hover:opacity-10 transition-opacity rounded-full" />
          <Sparkles className="text-brand-primary/60 group-hover:text-brand-primary transition-colors" size={18} strokeWidth={1.5} />
          {hasBadge && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold animate-pulse z-10 px-1 border border-black text-center">
              {lowStockCount > 0 ? lowStockCount : '!'}
            </span>
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {gargiOpen && (
          <div className="absolute inset-0 z-[150] flex items-center justify-center p-4 pointer-events-none bg-black/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="w-full max-w-[400px] h-[75vh] bg-brand-card rounded-[3rem] shadow-2xl flex flex-col border border-brand-border pointer-events-auto overflow-hidden relative"
            >
              {/* Header */}
              <div className="p-7 border-b border-white/5 flex items-center justify-between bg-brand-card">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                    <Sparkles className="text-brand-primary" size={22} />
                  </div>
                  <div>
                    <h4 className="text-brand-text font-serif italic text-lg leading-none mb-1">Fashion Concierge</h4>
                    <span className="text-[9px] text-brand-muted font-mono uppercase tracking-[0.2em]">Personalized Intelligence</span>
                  </div>
                </div>
                <button onClick={() => setGargiOpen(false)} className="p-2.5 hover:bg-white/5 rounded-full transition-colors text-brand-muted">
                  <X size={20} />
                </button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-7 space-y-5 no-scrollbar bg-brand-bg/20">
                {history.map((msg, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-[1.5rem] px-5 py-4 text-[13px] leading-relaxed ${msg.role === 'user'
                      ? 'bg-brand-primary text-black font-semibold shadow-lg shadow-brand-primary/10'
                      : 'bg-brand-bg/80 text-brand-text border border-white/10 backdrop-blur-md'
                      }`}>
                      <div className="markdown-body text-inherit">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>

                      {/* Low Stock Restock Replenishment Block */}
                      {msg.isRestockRecommendation && (
                        <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-brand-primary/20 space-y-3">
                          <p className="text-xs text-brand-primary font-mono uppercase tracking-wider font-bold">📦 Emergency Replenishment</p>
                          <p className="text-xs text-brand-text leading-relaxed">
                            Initiate replenishment order for category **{msg.restockCategory}**.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (msg.restockCategory) {
                                  orderRestock(msg.restockCategory);
                                }
                              }}
                              className="flex-1 py-2 bg-brand-primary text-black font-bold text-[10px] rounded-xl hover:bg-brand-primary/90 active:scale-95 transition-all uppercase tracking-wider font-mono"
                            >
                              Order
                            </button>
                            <button
                              onClick={() => {
                                if (msg.restockCategory) {
                                  cancelRestock(msg.restockCategory);
                                }
                              }}
                              className="flex-1 py-2 bg-white/10 hover:bg-white/15 text-brand-text font-bold text-[10px] rounded-xl active:scale-95 transition-all uppercase tracking-wider font-mono"
                            >
                              Cancel
                            </button>
                          </div>

                        </div>
                      )}

                      {/* Marketing Recommendation Block */}
                      {msg.isMarketingRecommendation && (
                        <div className="mt-4 p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/20 space-y-2">
                          <p className="text-xs text-brand-primary font-bold uppercase tracking-wider">🚀 Marketing Campaign Tip</p>
                          <p className="text-xs text-brand-text leading-relaxed">{msg.marketingTip}</p>
                        </div>
                      )}

                      {/* Positive Performance Report */}
                      {msg.isPerformanceReport && (
                        <div className="mt-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 space-y-2">
                          <p className="text-xs text-green-500 font-bold uppercase tracking-wider">📈 Performance Insight</p>
                          <p className="text-xs text-brand-text">{msg.performanceSummary}</p>
                        </div>
                      )}

                      {/* Inline Sale Recommendation Approval Block */}
                      {msg.showApprovalButtons && msg.approvalStatus === 'pending' && (
                        <div className="mt-4 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-3">
                          <p className="text-xs text-purple-500 font-mono uppercase tracking-wider font-bold">⚡ AI Recommendation</p>
                          <p className="text-xs text-brand-text leading-relaxed">Agent recommends launching a **{msg.agentData?.recommended_discount}%** Flash Sale for **{msg.agentData?.recommended_duration}** hours.</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleInlineApprove(i)}
                              className="flex-1 py-2.5 bg-brand-primary text-black font-bold text-xs rounded-xl hover:bg-brand-primary/90 active:scale-95 transition-all uppercase tracking-wider font-mono text-[10px]"
                            >
                              Approve Sale
                            </button>
                            <button
                              onClick={() => handleInlineDecline(i)}
                              className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-brand-text font-bold text-xs rounded-xl active:scale-95 transition-all uppercase tracking-wider font-mono text-[10px]"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      )}

                      {msg.showApprovalButtons && msg.approvalStatus === 'approved' && (
                        <div className="mt-4 p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/25 space-y-2">
                          <p className="text-xs text-brand-primary font-bold">✓ Flash Sale Approved & Launched</p>
                          {msg.agentData?.before_state && (
                            <div className="text-[10px] text-brand-muted space-y-1 font-mono leading-normal pt-2 border-t border-white/5 mt-1">
                              <p>• BEFORE: {msg.agentData.before_state.inventory_status}</p>
                              <p>• CURRENT: {msg.agentData.recommended_discount}% discount active</p>
                            </div>
                          )}
                        </div>
                      )}

                      {msg.showApprovalButtons && msg.approvalStatus === 'declined' && (
                        <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                          <p className="text-xs text-brand-muted italic">✗ Recommendation Declined.</p>
                        </div>
                      )}

                      {/* Admin Mode - Before/After Comparative Metrics */}
                      {msg.isAgentResult && mode === 'admin' && msg.agentData && (
                        <div className="mt-4 pt-3 border-t border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono uppercase text-[9px] tracking-wider text-brand-primary font-bold">Before/After Metrics</span>
                            <span className="text-[9px] font-mono text-brand-muted uppercase">Comparison</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded-xl bg-white/5 border border-white/5 space-y-1">
                              <span className="text-[9px] font-mono text-brand-muted uppercase block">Before State</span>
                              <p className="font-semibold text-brand-text truncate text-[11px]">{msg.agentData.before_state?.inventory_status || 'Stagnant Stock'}</p>
                              <p className="text-[9px] text-brand-muted truncate">Discounts: {msg.agentData.before_state?.active_discounts || 'None'}</p>
                            </div>
                            <div className="p-2 rounded-xl bg-brand-primary/5 border border-brand-primary/10 space-y-1">
                              <span className="text-[9px] font-mono text-brand-primary uppercase block">Target State</span>
                              <p className="font-semibold text-brand-primary truncate text-[11px]">{msg.agentData.recommended_discount}% Flash Sale</p>
                              <p className="text-[9px] text-brand-muted truncate">Duration: {msg.agentData.recommended_duration} hrs</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Admin Mode - Latest Agent Logs Summary */}
                      {msg.isAgentResult && mode === 'admin' && (
                        <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                          <div className="flex items-center gap-1.5 text-brand-primary">
                            <BrainCircuit size={12} />
                            <span className="font-mono uppercase text-[9px] tracking-wider font-bold">Latest Agent Logs</span>
                          </div>
                          <div className="space-y-1 font-mono text-[9px] text-brand-muted">
                            <p>• [SYSTEM] Run Analysis - complete. Risk: {msg.agentData?.risk_level}</p>
                            <p>• [SYSTEM] Sale Recommended: {msg.agentData?.sale_recommended ? 'YES' : 'NO'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-brand-bg/80 rounded-full px-5 py-3 flex gap-1.5 border border-white/5">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-5 bg-brand-card border-t border-white/5 space-y-4">
                {/* Quick Action Buttons Row */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {['Run Agent Analysis', 'Check Stock Levels', 'View Agent Logs'].map((action) => (
                    <button
                      key={action}
                      onClick={() => handleQuickAction(action)}
                      className="whitespace-nowrap px-3 py-1.5 bg-brand-bg hover:bg-brand-bg/90 border border-white/10 text-brand-text font-mono uppercase text-[9px] tracking-wider rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                    >
                      <Sparkles size={10} className="text-brand-primary" />
                      {action}
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {isListening && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col items-center justify-center py-4 gap-3"
                    >
                      <VoiceVisualizer isActive={isListening} />
                      <span className="text-[9px] font-mono text-brand-primary uppercase tracking-[0.3em] animate-pulse">Capturing Voice...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="relative flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Converse with concierge..."
                      className="w-full bg-brand-bg border border-white/10 rounded-2xl py-4 pl-5 pr-12 text-sm text-brand-text focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 outline-none transition-all placeholder:text-brand-muted/30"
                    />
                    <button
                      onClick={toggleListening}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 p-1.5 transition-colors ${isListening ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-primary'}`}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    className="p-4 bg-brand-primary text-black rounded-2xl active:scale-95 transition-all shadow-xl shadow-brand-primary/10 disabled:opacity-50 disabled:grayscale"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
