import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { sendSaleStartEmail } from '../../services/emailService';
import { 
  FileUp, Search, Database, LineChart, 
  CheckCircle2, AlertCircle, Play, 
  ArrowRight, FileText, ImageIcon, 
  Mic, Table, CheckSquare, MessageCircle,
  Activity, BrainCircuit, Loader2, AlertTriangle
} from 'lucide-react';
import { useStore } from '../../store/useStore';

const STEPS = [
  { label: 'Reading warehouse (STRUCTURED)...', icon: Database },
  { label: 'Reading supplier_email (SEMI-STRUCTURED)...', icon: FileText },
  { label: 'Reading sales_dashboard (STRUCTURED)...', icon: LineChart },
  { label: 'Reading customer_reviews (UNSTRUCTURED)...', icon: MessageCircle },
  { label: 'Reading news_feed (SEMI-STRUCTURED)...', icon: Activity },
  { label: 'Identifying Contradictions', icon: AlertTriangle },
  { label: 'Synthesizing Final Conclusion', icon: BrainCircuit }
];

const SOURCE_CONFIG = [
  { id: 'warehouse', label: 'warehouse', type: 'STRUCTURED', stale: true },
  { id: 'supplier_email', label: 'supplier_email', type: 'SEMI-STRUCTURED', stale: false },
  { id: 'sales_dashboard', label: 'sales_dashboard', type: 'STRUCTURED', stale: false },
  { id: 'customer_reviews', label: 'customer_reviews', type: 'UNSTRUCTURED', stale: false },
  { id: 'news_feed', label: 'news_feed', type: 'SEMI-STRUCTURED', stale: false },
];

export default function AIIntelligence() {
  const navigate = useNavigate();
  const { setGargiOpen, inventory, kpiRevenue, kpiOrders, kpiCustomers, orderRestock, cancelRestock, orderedCategories } = useStore();
  const [status, setStatus] = useState<'idle' | 'processing' | 'ready' | 'executed'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSources, setSelectedSources] = useState<string[]>(['PDF/Docs']);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);
  
  const [sourcesLoading, setSourcesLoading] = useState<Record<string, boolean>>({
    warehouse: true,
    supplier_email: true,
    sales_dashboard: true,
    customer_reviews: true,
    news_feed: true
  });
  const [sourceData, setSourceData] = useState<Record<string, any>>({});

  useEffect(() => {
    SOURCE_CONFIG.forEach(async (source) => {
      try {
        const res = await fetch(`http://localhost:3001/${source.id}`);
        const data = await res.json();
        setSourceData(prev => ({ ...prev, [source.id]: data }));
      } catch (err) {
        console.error(`Failed to fetch ${source.id}`, err);
      } finally {
        setSourcesLoading(prev => ({ ...prev, [source.id]: false }));
      }
    });
  }, []);

  // Real Agent States
  const [error, setError] = useState<string | null>(null);
  const [agentData, setAgentData] = useState<any>(null);
  const [insightsDismissed, setInsightsDismissed] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [pendingAgentData, setPendingAgentData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  // Interactive Preference States
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [durationHours, setDurationHours] = useState<number>(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);

  // Marketing Campaign Approval States
  const [campaignType, setCampaignType] = useState('Send promotional push notification to customers');
  const [targetAudience, setTargetAudience] = useState('Wishlist Customers');
  const [estimatedReach, setEstimatedReach] = useState('1,200 users');
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (targetAudience === 'Wishlist Customers') {
      setEstimatedReach('1,200 users');
    } else if (targetAudience === 'All Customers') {
      setEstimatedReach('10,900 users');
    } else if (targetAudience === 'Inactive Shoppers') {
      setEstimatedReach('3,450 users');
    } else if (targetAudience === 'Repeat Buyers') {
      setEstimatedReach('2,100 users');
    }
  }, [targetAudience]);

  // Comparative Pricing States
  const [productsBefore, setProductsBefore] = useState<any[]>([]);
  const [productsAfter, setProductsAfter] = useState<any[]>([]);

  // Single File Ingestion States
  const [uploadState, setUploadState] = useState<'idle' | 'loading' | 'success' | 'rejected'>('idle');
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isMerged, setIsMerged] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setUploadState('loading');
    setUploadResult(null);
    setIsMerged(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        const res = await fetch('/api/upload/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileContent: text.substring(0, 10000)
          })
        });

        if (!res.ok) {
          throw new Error('Upload analysis failed');
        }

        const data = await res.json();
        setUploadResult(data);
        if (data.relevant) {
          setUploadState('success');
        } else {
          setUploadState('rejected');
        }
      } catch (err) {
        console.error(err);
        setUploadState('rejected');
        setUploadResult({
          relevant: false,
          reason: 'Network error or analysis failure. We apologize, but we could not complete the processing of this file.',
          comparison: []
        });
      }
    };

    reader.readAsText(file);
  };

  // Poll central logs in backend
  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/agent/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to sync trace logs:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  const toggleSource = (label: string) => {
    setSelectedSources([label]);
  };

  const handleStart = async () => {
    setStatus('processing');
    setCurrentStep(0);
    setDataFetched(false);
    setPendingAgentData(null);
    setInsightsDismissed(false);
    setError(null);
    setLogs([]); // clear logs for new run

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    const eventSource = new EventSource('/api/orchestrator/run');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Add to live logs
        if (data.type === 'start' || data.type === 'agent_start' || data.type === 'agent_complete' || data.type === 'awaiting_approval') {
           setLogs(prev => [...prev, { 
             action: data.type.toUpperCase(), 
             result: data.message || `Agent: ${data.agent || 'Orchestrator'}`, 
             timestamp: new Date().toISOString() 
           }]);
        }

        if (data.type === 'awaiting_approval') {
          // data has action, recommended_discount, recommended_duration, reasoning, analysis_result, action_chain
          const formattedData = {
            workplan: `ShopAgent autonomous decision: ${data.reasoning}`,
            sources_analyzed: ['warehouse', 'supplier_email', 'sales_dashboard', 'customer_reviews', 'news_feed'],
            recommended_discount: data.recommended_discount,
            recommended_duration: data.recommended_duration,
            insights: data.analysis_result.insights,
            actionName: data.action.name,
            sale_recommended: data.sale_recommended === true && data.action.name === 'Launch flash sale',
            action_chain: data.action_chain ? data.action_chain.map((act: any) => {
              let status = act.status;
              if (act.id < data.action.id) {
                status = 'success';
              } else if (act.id === data.action.id) {
                status = 'awaiting_approval';
              }
              return {
                id: act.id,
                name: act.name,
                status: status,
                reasoning: act.reasoning,
                constraint_check: act.constraint_check
              };
            }) : [
              { id: 1, name: "Data Collection", status: "success", reasoning: "All sources verified." },
              { id: 2, name: "Contradiction Analysis", status: "success", reasoning: "Resolved stock mismatch." },
              { id: 3, name: "Constraint Validation", status: "success", reasoning: "Budget and timeline met." },
              { id: 4, name: data.action.name, status: "awaiting_approval", reasoning: data.action.reasoning, constraint_check: data.action.constraint_check },
            ],
            contradictions: data.analysis_result.contradictions.map((c: any) => `${c.metric}: ${c.resolution}`)
          };
          setPendingAgentData(formattedData);
          setDataFetched(true);
          eventSource.close();
        } else if (data.type === 'complete') {
           const formattedData = {
            workplan: `ShopAgent autonomous run complete.`,
            sources_analyzed: ['warehouse', 'supplier_email', 'sales_dashboard', 'customer_reviews', 'news_feed'],
            recommended_discount: 0,
            recommended_duration: 0,
            insights: data.trace.analysis.insights,
            action_chain: data.trace.decisions.action_chain,
            contradictions: data.trace.analysis.contradictions.map((c: any) => `${c.metric}: ${c.resolution}`)
          };
          setPendingAgentData(formattedData);
          setDataFetched(true);
          eventSource.close();
        } else if (data.type === 'error') {
          setError(data.message);
          setStatus('idle');
          eventSource.close();
        }
      } catch (err) {
        console.error("Error parsing SSE data", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      eventSource.close();
      setStatus(prev => {
        if (prev === 'processing') return 'idle';
        return prev;
      });
      setError("Connection to orchestrator lost.");
    };
  };

  const dataFetchedRef = useRef(dataFetched);
  const pendingAgentDataRef = useRef(pendingAgentData);

  useEffect(() => {
    dataFetchedRef.current = dataFetched;
    pendingAgentDataRef.current = pendingAgentData;
  }, [dataFetched, pendingAgentData]);

  // Synchronize visual step orbital loader with real api results
  useEffect(() => {
    if (status === 'processing') {
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < STEPS.length - 1) {
            return prev + 1;
          } else {
            // Reached last visual step, wait until API resolves
            if (dataFetchedRef.current && pendingAgentDataRef.current) {
              clearInterval(interval);
              setAgentData(pendingAgentDataRef.current);
              // Prefill preferences with AI values
              setDiscountPercent(pendingAgentDataRef.current.recommended_discount || 0);
              setDurationHours(pendingAgentDataRef.current.recommended_duration || 0);
              setDurationMinutes(0);
              setDurationSeconds(0);
              setStatus('ready');
            }
            return prev;
          }
        });
      }, 700); // 700ms interval for premium transition timing
      return () => clearInterval(interval);
    }
  }, [status]);

  const handleExecuteSale = async () => {
    try {
      setShowConfirmation(false);
      const totalDuration = durationHours + (durationMinutes / 60) + (durationSeconds / 3600);

      const res = await fetch('/api/orchestrator/approve-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discount: discountPercent,
          duration: totalDuration
        })
      });

      if (!res.ok) {
        throw new Error('Deploy execution pipeline failed');
      }

      // Trigger email start notification
      try {
        await sendSaleStartEmail(discountPercent, totalDuration);
      } catch (emailErr) {
        console.error("Failed to send sale start email:", emailErr);
      }

      setIsRedirecting(true);
      setTimeout(() => {
        setIsRedirecting(false);
        navigate('/admin', { 
          state: { 
            showSaleResult: true, 
            discountPercent, 
            duration: totalDuration 
          } 
        });
      }, 1500);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Execution failed');
    }
  };

  const handleExecuteMarketing = async () => {
    try {
      setShowConfirmation(false);
      const res = await fetch('/api/orchestrator/approve-marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignType,
          targetAudience,
          estimatedReach
        })
      });

      if (!res.ok) {
        throw new Error('Deploy marketing execution pipeline failed');
      }

      setIsRedirecting(true);
      setTimeout(() => {
        setIsRedirecting(false);
        navigate('/admin', { 
          state: { 
            showCampaignResult: true, 
            campaignType, 
            targetAudience, 
            estimatedReach 
          } 
        });
      }, 1500);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Execution failed');
    }
  };

  const handleEndSale = async () => {
    try {
      const res = await fetch('/api/agent/end-sale', { method: 'POST' });
      if (res.ok) {
        setStatus('idle');
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const lowStockItems = inventory.filter(p => p.stock < 5);

  return (
    <div className="flex flex-col px-6 pt-8 pb-8 gap-8 w-full">
      {isRedirecting && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6"
          >
            <Loader2 size={48} className="text-brand-primary animate-spin mx-auto animate-pulse" />
            <h3 className="text-xl font-serif italic text-brand-text">Deploying Strategy Pipeline...</h3>
            <p className="text-xs text-brand-muted font-mono tracking-widest uppercase">Securing N-55 Indus routes & sync networks</p>
          </motion.div>
        </div>
      )}
      <header>
        <h1 className="text-3xl font-serif text-brand-text">Central Intelligence</h1>
        <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mt-1">Autonomous Store Optimization</p>
      </header>

      {/* Critical Low-Stock Recommendation Badge / Card */}
      {lowStockItems.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-card p-6 rounded-3xl border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)] relative overflow-hidden space-y-4 shrink-0"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500 overflow-hidden">
            <motion.div 
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
              className="w-1/2 h-full bg-white/20"
            />
          </div>
          
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle size={24} className="animate-pulse" />
            <h3 className="text-lg font-serif italic text-brand-text">CRITICAL LOW-STOCK RECOMMENDATION</h3>
          </div>
          
          <p className="text-xs text-brand-muted leading-relaxed font-serif">
            Our real-time retail auditor has flagged the following items as critically low (less than 5 units). Immediate restocking is highly recommended to secure demand yield:
          </p>

          <div className="divide-y divide-white/5 bg-brand-bg/50 p-4 rounded-2xl border border-white/5 space-y-2 max-h-40 overflow-y-auto no-scrollbar">
            {lowStockItems.map((item) => {
              const isOrdered = orderedCategories.includes(item.category);
              return (
                <div key={item.id} className="flex justify-between items-center py-2 text-xs">
                  <div className="flex flex-col">
                    <span className="text-brand-text font-serif italic">{item.name}</span>
                    <span className="text-[8px] font-mono text-brand-muted uppercase tracking-wider">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-full font-mono text-[9px] bg-red-500/20 text-red-400 font-bold">
                      {item.stock} LEFT
                    </span>
                    {isOrdered ? (
                      <span className="px-2.5 py-1 rounded-full font-mono text-[8px] bg-brand-primary/10 text-brand-primary border border-brand-primary/20 font-bold uppercase tracking-widest">
                        Ordered Label
                      </span>
                    ) : (
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => orderRestock(item.category)}
                          className="px-3 py-1 bg-brand-primary text-black font-mono text-[9px] font-bold uppercase rounded-lg hover:scale-105 active:scale-95 transition-all shadow-md"
                        >
                          Order
                        </button>
                        <button 
                          onClick={() => cancelRestock(item.category)}
                          className="px-3 py-1 bg-brand-bg text-brand-muted font-mono text-[9px] uppercase rounded-lg border border-white/5 hover:text-white transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {status === 'idle' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center py-4 gap-8"
        >
          {error && (
            <div className="w-full bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-xs text-red-400 text-center font-mono">
              ERROR: {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
            {SOURCE_CONFIG.map((source, i) => {
              const isLoading = sourcesLoading[source.id];
              return (
                <div 
                  key={i} 
                  className="p-4 rounded-2xl border border-white/10 bg-brand-card flex flex-col gap-3 relative overflow-hidden transition-all hover:border-white/20"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-serif text-brand-text italic font-bold">
                        {source.label}
                      </span>
                      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary w-max">
                        {source.type}
                      </span>
                    </div>
                    {isLoading ? (
                      <Loader2 size={16} className="text-brand-muted animate-spin shrink-0" />
                    ) : (
                      <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-[9px] font-mono mt-1">
                    {isLoading ? (
                      <span className="text-brand-muted flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin"/> Fetching from localhost:3001...
                      </span>
                    ) : source.stale ? (
                      <span className="text-yellow-400 flex items-center gap-1">
                        <AlertTriangle size={10}/> ⚠️ STALE (3 days old)
                      </span>
                    ) : (
                      <span className="text-green-400 flex items-center gap-1">
                        <CheckSquare size={10}/> ✅ FRESH (today)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* File Upload Component */}
          <div className="w-full bg-brand-card rounded-3xl border border-white/5 p-6 flex flex-col items-center gap-4 relative overflow-hidden transition-all hover:border-white/10">
            <h3 className="text-xs font-mono text-brand-muted uppercase tracking-widest self-start">Document Ingestion Stream</h3>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload}
            />

            {uploadState === 'idle' && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-brand-muted/20 rounded-2xl flex flex-col items-center justify-center p-6 text-center gap-3 group cursor-pointer hover:border-brand-primary/40 transition-all"
              >
                <div className="p-3 bg-brand-primary/10 rounded-full group-hover:scale-110 transition-transform">
                  <FileUp size={24} className="text-brand-primary" />
                </div>
                <div>
                  <p className="text-brand-text text-xs font-medium">Ingest External Document</p>
                  <p className="text-brand-muted text-[8px] uppercase font-mono mt-1 tracking-wider">
                    One file at a time • PDF, XLSX, CSV, JSON, TXT, PNG, JPG
                  </p>
                </div>
              </div>
            )}

            {uploadState === 'loading' && (
              <div className="w-full py-8 flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="text-brand-primary animate-spin" />
                <p className="text-xs font-mono text-brand-primary uppercase tracking-widest animate-pulse">Analyzing document with Gemini...</p>
                <p className="text-[9px] text-brand-muted truncate max-w-[200px]">{uploadedFileName}</p>
              </div>
            )}

            {uploadState === 'success' && uploadResult && (
              <div className="w-full space-y-4 text-left">
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex gap-3 items-start">
                  <CheckCircle2 className="text-green-400 shrink-0 mt-0.5" size={18} />
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-green-400 font-bold uppercase tracking-wider">DOCUMENT RELEVANT & VERIFIED</p>
                    <p className="text-xs text-green-300 font-serif italic">{uploadResult.reason}</p>
                    <p className="text-[9px] font-mono text-brand-muted mt-1 uppercase font-bold">
                      Classification: <span className="text-brand-primary">{uploadResult.classification}</span>
                    </p>
                  </div>
                </div>

                {uploadResult.summary && (
                  <div className="bg-brand-bg rounded-2xl p-4 border border-white/5 space-y-1">
                    <h5 className="text-[8px] font-mono text-brand-muted uppercase tracking-wider">Ingested Summary</h5>
                    <p className="text-xs text-brand-text font-serif italic leading-relaxed">{uploadResult.summary}</p>
                  </div>
                )}

                {uploadResult.comparison && uploadResult.comparison.length > 0 && (
                  <div className="bg-brand-bg rounded-2xl p-4 border border-white/5 space-y-3">
                    <h5 className="text-[8px] font-mono text-brand-muted uppercase tracking-wider">Local DB Cross-Reference</h5>
                    <div className="divide-y divide-white/5 space-y-2">
                      {uploadResult.comparison.map((comp: any, i: number) => (
                        <div key={i} className="flex justify-between items-start pt-2 first:pt-0 text-[10px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-brand-text font-serif italic">{comp.item}</span>
                            <span className="text-[8px] font-mono text-brand-muted">Discrepancy: {comp.discrepancy}</span>
                          </div>
                          <div className="flex flex-col items-end font-mono">
                            <span className="text-brand-primary">Uploaded: {comp.sourceValue}</span>
                            <span className="text-brand-muted">Local DB: {comp.localValue}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setUploadState('idle');
                      setUploadResult(null);
                      setUploadedFileName(null);
                      setIsMerged(false);
                    }}
                    className="flex-1 bg-brand-bg hover:bg-white/5 text-brand-muted py-3 rounded-xl font-mono text-[9px] uppercase tracking-wider border border-white/5 active:scale-95 transition-transform"
                  >
                    Clear File
                  </button>
                  <button 
                    disabled={isMerged}
                    onClick={() => setIsMerged(true)}
                    className={`flex-[2] py-3 rounded-xl font-mono text-[9px] uppercase tracking-wider font-bold transition-all ${
                      isMerged 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default' 
                        : 'bg-brand-primary text-black hover:scale-[1.02] active:scale-95'
                    }`}
                  >
                    {isMerged ? 'Details Merged' : 'Merge Details with Database'}
                  </button>
                </div>
              </div>
            )}

            {uploadState === 'rejected' && uploadResult && (
              <div className="w-full space-y-4 text-left">
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex gap-3 items-start">
                  <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-red-400 font-bold uppercase tracking-wider">DOCUMENT REJECTED</p>
                    <p className="text-xs text-red-300 font-serif italic leading-relaxed">
                      We apologize, but this document is not relevant to clothing, fashion, textiles, retail inventory, or GarKS store operations.
                    </p>
                    <p className="text-[10px] text-red-400/80 font-mono mt-1 font-bold">Reason: {uploadResult.reason}</p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setUploadState('idle');
                    setUploadResult(null);
                    setUploadedFileName(null);
                  }}
                  className="w-full bg-brand-bg hover:bg-white/5 text-brand-muted py-3 rounded-xl font-mono text-[9px] uppercase tracking-wider border border-white/5 active:scale-95 transition-transform"
                >
                  Try Another File
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={handleStart}
            className={`w-full text-black font-bold py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl ${
              selectedSources.length === 0 ? 'bg-brand-secondary' : 'bg-brand-primary'
            }`}
          >
            <Play size={20} />
            <span className="font-mono text-xs uppercase tracking-widest">Run Agent Workflow</span>
          </button>
        </motion.div>
      )}

      {status === 'processing' && (
        <div className="flex-1 flex flex-col items-center justify-center py-4">
          <div className="w-64 h-64 relative mb-12">
            {/* Pulsing Core */}
            <div className="absolute inset-0 border-2 border-brand-primary/10 rounded-full animate-ping" />
            <div className="absolute inset-0 border-2 border-brand-primary/20 rounded-full animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-4 border-2 border-brand-secondary/20 rounded-full animate-[spin_7s_linear_infinite_reverse]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BrainCircuit size={80} className="text-brand-primary animate-pulse" />
            </div>
            
            {/* 7-Step Orbital Flow */}
            {STEPS.map((step, i) => {
              const isActive = i === currentStep;
              const isPast = i < currentStep;
              const angle = (i / STEPS.length) * Math.PI * 2 - Math.PI / 2;
              const x = Math.cos(angle) * 128;
              const y = Math.sin(angle) * 128;
              return (
                <div key={i} className="absolute left-1/2 top-1/2 -ml-4 -mt-4" style={{ transform: `translate(${x}px, ${y}px)` }}>
                  <motion.div
                    animate={{ 
                      scale: isActive ? 1.4 : 1,
                      backgroundColor: isActive ? '#4ade80' : (isPast ? '#4ade8040' : '#172925'),
                      borderColor: isActive ? '#4ade80' : (isPast ? '#4ade80' : '#2a3f38')
                    }}
                    className="w-8 h-8 rounded-full border flex items-center justify-center shadow-lg"
                  >
                    <step.icon size={14} className={isActive ? 'text-black' : (isPast ? 'text-brand-primary' : 'text-brand-muted')} />
                  </motion.div>
                  {isActive && (
                    <motion.div 
                      layoutId="orb-glow"
                      className="absolute inset-0 bg-brand-primary rounded-full blur-md opacity-50"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center space-y-3">
            <motion.h3 
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-serif text-brand-text"
            >
              {STEPS[currentStep].label}
            </motion.h3>
            <div className="flex justify-center gap-1">
              {STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === currentStep ? 'w-8 bg-brand-primary' : (i < currentStep ? 'w-2 bg-brand-primary/40' : 'w-2 bg-white/5')
                  }`} 
                />
              ))}
            </div>
            <p className="text-brand-muted font-mono text-[9px] uppercase tracking-[0.3em]">ShopAgent Reasoning Active...</p>
          </div>
        </div>
      )}

      {status === 'ready' && agentData && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 overflow-y-auto no-scrollbar max-h-[60vh] pr-1"
        >
          {/* Workplan Banner */}
          <div className="bg-brand-card p-6 rounded-3xl border border-brand-primary/30 relative overflow-hidden shadow-2xl space-y-3">
            <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary overflow-hidden">
               <motion.div 
                 animate={{ x: ['-100%', '100%'] }}
                 transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                 className="w-1/2 h-full bg-white/20"
               />
            </div>
            <div className="flex items-center gap-3">
              <BrainCircuit className="text-brand-primary" size={24} />
              <h3 className="text-xl font-serif">ShopAgent Autonomous Workplan</h3>
            </div>
            <p className="text-brand-muted text-sm leading-relaxed font-serif">
              {agentData.workplan}
            </p>
          </div>

          {/* Store Data Summary Table */}
          <div className="bg-brand-card p-5 rounded-3xl border border-white/5 space-y-4">
            <h4 className="text-[10px] font-mono text-brand-muted uppercase tracking-widest">Store Data Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-brand-bg rounded-2xl p-3 border border-white/5">
                <p className="text-[10px] font-mono text-brand-muted uppercase">Revenue</p>
                <p className="text-lg font-bold font-mono text-brand-primary">${kpiRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-brand-bg rounded-2xl p-3 border border-white/5">
                <p className="text-[10px] font-mono text-brand-muted uppercase">Orders</p>
                <p className="text-lg font-bold font-mono text-white">{kpiOrders.toLocaleString()}</p>
              </div>
              <div className="bg-brand-bg rounded-2xl p-3 border border-white/5">
                <p className="text-[10px] font-mono text-brand-muted uppercase">Total Stock</p>
                <p className="text-lg font-bold font-mono text-white">{inventory.reduce((acc, item) => acc + item.stock, 0)}</p>
              </div>
              <div className="bg-brand-bg rounded-2xl p-3 border border-white/5">
                <p className="text-[10px] font-mono text-brand-muted uppercase">Customers</p>
                <p className="text-lg font-bold font-mono text-white">{kpiCustomers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Sources Badge Row */}
          <div className="bg-brand-card p-5 rounded-3xl border border-white/5 space-y-3">
            <h4 className="text-[10px] font-mono text-brand-muted uppercase tracking-widest">Data Streams Analyzed</h4>
            <div className="flex flex-wrap gap-2">
              {agentData.sources_analyzed.map((srcName: string, i: number) => {
                let badgeType = "UNSTRUCTURED";
                let badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                
                const nameLower = srcName.toLowerCase();
                if (nameLower.includes('warehouse') || nameLower.includes('dashboard')) {
                  badgeType = "STRUCTURED";
                  badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                } else if (nameLower.includes('email') || nameLower.includes('feed') || nameLower.includes('news')) {
                  badgeType = "SEMI-STRUCTURED";
                  badgeColor = "bg-teal-500/10 text-teal-400 border-teal-500/20";
                }

                return (
                  <div key={i} className={`px-3 py-1.5 rounded-xl border text-[9px] font-mono flex items-center gap-2 ${badgeColor}`}>
                    <span className="font-bold uppercase">{srcName}</span>
                    <span className="opacity-50 font-light text-[8px] border-l pl-2 border-current">{badgeType}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contradictions Alerts */}
          {agentData.contradictions && agentData.contradictions.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={20} />
                <h4 className="text-xs font-mono uppercase tracking-wider font-bold">Contradiction Warning</h4>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-red-300 font-serif italic">
                {agentData.contradictions.map((conflict: string, i: number) => (
                  <li key={i}>{conflict}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Insights (5 cards) */}
          {!insightsDismissed && agentData.insights && agentData.insights.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pl-1">
                <h4 className="text-[10px] font-mono text-brand-muted uppercase tracking-widest">Key Operational Insights</h4>
                <button 
                  onClick={() => setInsightsDismissed(true)}
                  className="text-[9px] font-mono text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider flex items-center gap-1 active:scale-95 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-xl"
                >
                  Dismiss Insights
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {agentData.insights.map((insightText: string, i: number) => (
                  <div key={i} className="bg-brand-card p-4 rounded-2xl border border-white/5 flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-[9px] font-mono shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-xs text-brand-text leading-relaxed font-serif italic">{insightText}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Chain */}
          <div className="bg-brand-card p-5 rounded-3xl border border-white/5 space-y-4">
            <h4 className="text-[10px] font-mono text-brand-muted uppercase tracking-widest">Recommended Action Chain</h4>
            <div className="space-y-3">
              {agentData.action_chain.map((action: any, i: number) => (
                <div key={action.id || i} className="bg-brand-bg p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono uppercase text-brand-primary font-bold">Step {action.id}: {action.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-mono bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase">
                      {action.status || 'pending'}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-text font-serif italic">{action.reasoning}</p>
                  <div className="text-[9px] font-mono text-brand-muted uppercase tracking-wider flex items-center gap-1 border-t border-white/5 pt-2 mt-1">
                    <CheckSquare size={10} className="text-brand-primary" />
                    Constraint Check: <span className="text-brand-text normal-case italic font-serif">{action.constraint_check}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button 
              onClick={() => setGargiOpen(true)}
              className="flex-1 bg-brand-secondary/10 text-brand-secondary font-bold py-5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all border border-brand-secondary/20"
            >
              <MessageCircle size={18} /> <span className="font-mono text-[10px] uppercase tracking-widest">Discuss</span>
            </button>
            <button 
              onClick={() => setShowConfirmation(true)}
              className="flex-[2] bg-brand-primary text-black font-bold py-5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
            >
              <span className="font-mono text-xs uppercase tracking-widest">Apply Strategy</span> <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Dynamic Sale Interception Approval Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center px-8 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-card p-8 rounded-[3rem] border border-brand-primary/40 text-center space-y-6 shadow-[0_0_50px_rgba(63,185,80,0.1)] max-w-sm w-full"
            >
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto">
                <CheckSquare size={32} className="text-brand-primary animate-pulse" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-serif italic text-brand-text">
                  {agentData?.sale_recommended ? "Authorize Retail Strategy" : "Agent recommends Marketing Campaign"}
                </h4>
                {agentData?.sale_recommended ? (
                  <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl space-y-2 text-left">
                    <p className="text-xs font-mono uppercase text-brand-primary font-bold">Agent Recommendation</p>
                    <p className="text-[11px] text-brand-text leading-relaxed font-serif italic">
                      "Execute a {agentData.recommended_discount}% flash sale for {agentData.recommended_duration} hours to optimize inventory before N-55 logjams stall inbound shipments."
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl space-y-2 text-left">
                    <p className="text-xs font-mono uppercase text-brand-primary font-bold">Agent Recommendation</p>
                    <p className="text-[11px] text-brand-text leading-relaxed font-serif italic">
                      "Active sale detected. Initiating multi-channel marketing campaign to highlight low-stock items and wishlist products without duplicate discounting."
                    </p>
                  </div>
                )}
              </div>

              {/* Preference sliders or interactive controller units */}
              <div className="space-y-4 text-left border-y border-white/5 py-4 my-2">
                {agentData?.sale_recommended ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono text-brand-muted uppercase tracking-wider">Sale Discount (%)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range" 
                          min="5" 
                          max="75" 
                          value={discountPercent} 
                          onChange={(e) => setDiscountPercent(Number(e.target.value))}
                          className="flex-1 accent-brand-primary bg-brand-bg rounded-lg appearance-none h-1 cursor-pointer"
                        />
                        <span className="text-sm font-mono text-brand-primary font-bold shrink-0 w-10 text-right">{discountPercent}%</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono text-brand-muted uppercase tracking-wider">Active Duration</label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1">
                          <input 
                            type="number" 
                            min="0" 
                            max="24" 
                            value={durationHours} 
                            onChange={(e) => setDurationHours(Math.max(0, Number(e.target.value)))}
                            className="bg-brand-bg border border-white/10 rounded-xl px-2 py-1.5 text-xs text-brand-text font-mono text-center focus:outline-none focus:border-brand-primary"
                          />
                          <span className="text-[7px] font-mono text-brand-muted uppercase text-center">Hours</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <input 
                            type="number" 
                            min="0" 
                            max="59" 
                            value={durationMinutes} 
                            onChange={(e) => setDurationMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
                            className="bg-brand-bg border border-white/10 rounded-xl px-2 py-1.5 text-xs text-brand-text font-mono text-center focus:outline-none focus:border-brand-primary"
                          />
                          <span className="text-[7px] font-mono text-brand-muted uppercase text-center">Mins</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <input 
                            type="number" 
                            min="0" 
                            max="59" 
                            value={durationSeconds} 
                            onChange={(e) => setDurationSeconds(Math.max(0, Math.min(59, Number(e.target.value))))}
                            className="bg-brand-bg border border-white/10 rounded-xl px-2 py-1.5 text-xs text-brand-text font-mono text-center focus:outline-none focus:border-brand-primary"
                          />
                          <span className="text-[7px] font-mono text-brand-muted uppercase text-center">Secs</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono text-brand-muted uppercase tracking-wider">Campaign Type Selection</label>
                      <select 
                        value={campaignType}
                        onChange={(e) => setCampaignType(e.target.value)}
                        className="bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-primary w-full font-serif italic"
                      >
                        <option value="Send promotional push notification to customers">Send promotional push notification to customers</option>
                        <option value="Highlight low-stock items as 'Almost Gone!'">Highlight low-stock items as "Almost Gone!"</option>
                        <option value="Create urgency banner: 'Only X units left!'">Create urgency banner: "Only X units left!"</option>
                        <option value="Email campaign to wishlist customers">Email campaign to wishlist customers</option>
                        <option value="Boost social media visibility">Boost social media visibility</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono text-brand-muted uppercase tracking-wider">Target Audience</label>
                      <select 
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
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
                  </>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={agentData?.sale_recommended ? handleExecuteSale : handleExecuteMarketing}
                  className="w-full bg-brand-primary text-black font-bold py-4 rounded-2xl font-mono text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  Approve & Launch Strategy
                </button>
                <button 
                  onClick={() => setShowConfirmation(false)}
                  className="w-full bg-brand-bg text-brand-muted py-4 rounded-2xl font-mono text-[10px] uppercase tracking-widest border border-white/5 active:scale-95 transition-transform"
                >
                  Reject Strategy
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {status === 'executed' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-6"
        >
          <div className="relative">
            <div className="w-24 h-24 bg-brand-primary/20 rounded-full flex items-center justify-center">
              <CheckCircle2 size={48} className="text-brand-primary" />
            </div>
            <motion.div 
              initial={{ rotate: -15, scale: 0, opacity: 0 }}
              animate={{ rotate: -15, scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="absolute -top-2 -right-4 bg-brand-secondary text-black px-3 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-tighter shadow-lg font-mono"
            >
              Active
            </motion.div>
          </div>
          
          <div className="space-y-2 px-4">
            <h3 className="text-2xl font-serif italic font-light">Elegance Executed</h3>
            <p className="text-brand-muted text-xs font-serif italic leading-relaxed">"GarKS inventory adaptive state is deployed globally."</p>
          </div>

          {/* Dynamic price changes before / after comparative catalog */}
          {productsAfter.length > 0 && (
            <div className="w-full bg-brand-card p-5 rounded-3xl border border-brand-primary/20 space-y-4 max-w-sm text-left shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-[9px] font-mono uppercase text-brand-primary tracking-wider font-bold">Catalog Price Adjustments</span>
                <span className="text-[8px] font-mono uppercase text-brand-muted">{discountPercent}% Discount</span>
              </div>
              <div className="divide-y divide-white/5 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                {productsAfter.map((product, i) => {
                  const original = productsBefore[i] || { price: product.price };
                  return (
                    <div key={product.id || i} className="py-2.5 flex justify-between items-center text-[11px]">
                      <span className="text-brand-text font-serif italic max-w-[180px] truncate">{product.name}</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-brand-muted line-through">${original.price.toFixed(2)}</span>
                        <ArrowRight size={10} className="text-brand-primary" />
                        <span className="text-brand-primary font-bold">${product.price.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex w-full gap-3 max-w-sm">
            <button 
              onClick={handleEndSale}
              className="flex-1 bg-red-500/10 text-red-400 font-bold py-4 rounded-2xl border border-red-500/20 font-mono text-[9px] uppercase tracking-widest active:scale-95 transition-transform"
            >
              Terminate Sale
            </button>
            <button 
              onClick={() => {
                setStatus('idle');
                setAgentData(null);
                setPendingAgentData(null);
              }}
              className="flex-1 bg-brand-card text-brand-primary font-bold py-4 rounded-2xl border border-brand-primary/20 font-mono text-[9px] uppercase tracking-widest active:scale-95 transition-transform"
            >
              Dashboard
            </button>
          </div>
        </motion.div>
      )}

      {/* Dynamic Agent Log Trace Terminal */}
      <div className="mt-4 border border-white/5 rounded-3xl bg-[#090f0d] p-5 font-mono text-[10px] text-brand-primary/80 shadow-inner relative overflow-hidden w-full shrink-0">
        {/* Terminal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-brand-primary/80 animate-pulse" />
            <span className="text-brand-muted font-bold text-[8px] uppercase tracking-wider pl-1">Agent Trace Ledger</span>
          </div>
          <span className="text-[8px] uppercase tracking-widest text-brand-muted">LIVE SYNCED</span>
        </div>

        {/* Console Terminal Logs */}
        <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar pr-1 flex flex-col-reverse">
          {[...logs].reverse().map((log: any, i: number) => {
            const isWarn = log.action.toLowerCase().includes('fail') || log.result.toLowerCase().includes('delay') || log.result.toLowerCase().includes('block');
            const isSuccess = log.action.toLowerCase().includes('sale') || log.action.toLowerCase().includes('complete') || log.action.toLowerCase().includes('initialization');
            
            let colorClass = "text-brand-primary/70";
            if (isWarn) colorClass = "text-red-400";
            else if (isSuccess) colorClass = "text-emerald-400";

            return (
              <div key={i} className="flex gap-2 leading-relaxed">
                <span className="text-brand-muted shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className="text-brand-secondary shrink-0">{log.action}:</span>
                <span className={`${colorClass} italic`}>{log.result}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
