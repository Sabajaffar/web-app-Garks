import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, Users, ShoppingBag, DollarSign, 
  Camera, ArrowUpRight, Activity, Zap,
  BarChart3, RefreshCcw, BrainCircuit, MessageSquare, Volume2,
  ChevronRight, Sparkles, CheckCircle2, Megaphone, X
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { haptic } from '../../lib/utils';
import { useStore } from '../../store/useStore';

const INITIAL_SALE_DATA = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 5000 },
  { name: 'Thu', value: 2780 },
  { name: 'Fri', value: 6890 },
  { name: 'Sat', value: 8900 },
  { name: 'Sun', value: 7200 },
];

const INITIAL_CATEGORY_DATA = [
  { name: 'Men', value: 45, color: '#4ade80' },
  { name: 'Women', value: 35, color: '#67e8a5' },
  { name: 'Kids', value: 15, color: '#60a5fa' },
  { name: 'Luxury', value: 5, color: '#a855f7' },
];

const INITIAL_KPI_CARDS = [
  { label: 'Revenue', value: 45231, change: '+12.5%', icon: DollarSign, color: '#4ade80', prefix: '$' },
  { label: 'Orders', value: 1284, change: '+8.2%', icon: ShoppingBag, color: '#67e8a5', prefix: '' },
  { label: 'Customers', value: 10902, change: '+24.1%', icon: Users, color: '#60a5fa', prefix: '' },
  { label: 'AOV', value: 124.5, change: '-2.4%', icon: Activity, color: '#f87171', prefix: '$' },
];

const TOP_CITIES = [
  { city: 'Karachi', rate: '42%' },
  { city: 'Lahore', rate: '28%' },
  { city: 'Islamabad', rate: '15%' },
  { city: 'Faisalabad', rate: '10%' },
];

const PEAK_HOURS = [
  { time: '08:00', value: 120 },
  { time: '10:00', value: 450 },
  { time: '12:00', value: 890 },
  { time: '14:00', value: 670 },
  { time: '16:00', value: 540 },
  { time: '18:00', value: 1200 },
  { time: '20:00', value: 980 },
  { time: '22:00', value: 400 },
];

export default function AdminDashboard() {
  const { setToast, kpiRevenue, kpiOrders, kpiCustomers, kpiAOV } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Result popup state from AI page navigation
  const [resultPopup, setResultPopup] = useState<any>(null);

  useEffect(() => {
    if (location.state?.showCampaignResult) {
      setResultPopup({
        type: 'campaign',
        campaignType: location.state.campaignType,
        targetAudience: location.state.targetAudience,
        estimatedReach: location.state.estimatedReach,
      });
      // Clear the state so it doesn't re-show on navigation
      window.history.replaceState({}, '');
    } else if (location.state?.showSaleResult) {
      setResultPopup({
        type: 'sale',
        discountPercent: location.state.discountPercent,
        duration: location.state.duration,
      });
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const [saleData, setSaleData] = useState(INITIAL_SALE_DATA);
  const [categoryData, setCategoryData] = useState(INITIAL_CATEGORY_DATA);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [footfall, setFootfall] = useState(1402);

  const kpiCards = [
    { label: 'Revenue', value: kpiRevenue, change: '+12.5%', icon: DollarSign, color: '#4ade80', prefix: 'PKR ' },
    { label: 'Orders', value: kpiOrders, change: '+8.2%', icon: ShoppingBag, color: '#67e8a5', prefix: '' },
    { label: 'Customers', value: kpiCustomers, change: '+24.1%', icon: Users, color: '#60a5fa', prefix: '' },
    { label: 'AOV', value: kpiAOV, change: '-2.4%', icon: Activity, color: '#f87171', prefix: 'PKR ' },
  ];

  const handleRefresh = () => {
    haptic('medium');
    setIsRefreshing(true);
    
    // Simulate real-time fluctuation (±1-3%)
    setTimeout(() => {
      setSaleData(prev => prev.map(day => ({
        ...day,
        value: Math.floor(day.value * (1 + (Math.random() * 0.06 - 0.03)))
      })));

      setFootfall(prev => Math.floor(prev + (Math.random() * 10 - 2)));
      
      setIsRefreshing(false);
      setToast("Stream Synchronized");
    }, 800);
  };

  return (
    <div className="flex flex-col px-6 pt-8 pb-8 gap-8 w-full">

      {/* ── Result Summary Popup (from AI page navigation) ── */}
      <AnimatePresence>
        {resultPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end justify-center pb-8 px-6 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="bg-brand-card border border-brand-primary/30 rounded-[2.5rem] p-8 w-full max-w-sm shadow-[0_0_60px_rgba(63,185,80,0.2)] space-y-6 relative"
            >
              {/* Close */}
              <button
                onClick={() => setResultPopup(null)}
                className="absolute top-5 right-5 p-2 rounded-xl hover:bg-white/5 text-brand-muted transition-colors"
              >
                <X size={16} />
              </button>

              {/* Icon + Title */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto">
                  {resultPopup.type === 'campaign'
                    ? <Megaphone size={32} className="text-brand-primary" />
                    : <Zap size={32} className="text-brand-primary fill-current" />
                  }
                </div>
                <div>
                  <h4 className="text-xl font-serif italic text-brand-text">
                    {resultPopup.type === 'campaign' ? 'Campaign Launched!' : 'Flash Sale Active!'}
                  </h4>
                  <p className="text-[10px] font-mono text-brand-muted uppercase tracking-widest mt-1">
                    Strategy deployed successfully
                  </p>
                </div>
              </div>

              {/* Summary Details */}
              <div className="bg-brand-bg rounded-2xl p-4 border border-white/5 space-y-3">
                {resultPopup.type === 'campaign' ? (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-brand-muted font-mono uppercase tracking-wider text-[9px]">Campaign</span>
                      <span className="text-brand-text font-serif italic text-right max-w-[60%]">{resultPopup.campaignType}</span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-white/5 pt-2">
                      <span className="text-brand-muted font-mono uppercase tracking-wider text-[9px]">Audience</span>
                      <span className="text-brand-text font-mono text-[10px]">{resultPopup.targetAudience}</span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-white/5 pt-2">
                      <span className="text-brand-muted font-mono uppercase tracking-wider text-[9px]">Est. Reach</span>
                      <span className="text-brand-primary font-mono font-bold text-[10px]">{resultPopup.estimatedReach}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-brand-muted font-mono uppercase tracking-wider text-[9px]">Discount</span>
                      <span className="text-brand-primary font-mono font-bold text-[10px]">{resultPopup.discountPercent}% OFF</span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-white/5 pt-2">
                      <span className="text-brand-muted font-mono uppercase tracking-wider text-[9px]">Duration</span>
                      <span className="text-brand-text font-mono text-[10px]">{Number(resultPopup.duration).toFixed(1)} hrs</span>
                    </div>
                  </>
                )}
              </div>

              {/* Status Row */}
              <div className="flex items-center gap-2 bg-brand-primary/5 border border-brand-primary/20 rounded-xl px-4 py-3">
                <CheckCircle2 size={16} className="text-brand-primary shrink-0" />
                <p className="text-[10px] font-mono text-brand-primary uppercase tracking-wider">
                  All systems operational · Live monitoring active
                </p>
              </div>

              {/* CTA */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setResultPopup(null); navigate('/admin/ai'); }}
                  className="w-full bg-brand-primary text-black font-bold py-4 rounded-2xl font-mono text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
                >
                  <BrainCircuit size={16} /> Open AI Intelligence
                </button>
                <button
                  onClick={() => setResultPopup(null)}
                  className="w-full bg-brand-bg text-brand-muted py-3 rounded-2xl font-mono text-[9px] uppercase tracking-widest border border-white/5 active:scale-95 transition-transform"
                >
                  Stay on Dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-brand-text italic">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse shadow-[0_0_8px_#4ade80]" />
            <p className="text-brand-muted text-[10px] font-mono uppercase tracking-[0.2em]">Real-time performance</p>
          </div>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`p-3 bg-brand-card rounded-2xl border border-brand-border text-brand-muted transition-all duration-700 ${isRefreshing ? 'rotate-180 text-brand-primary border-brand-primary/30' : 'active:scale-95'}`}
        >
          <RefreshCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* KPI Grid */}
      <section className="grid grid-cols-2 gap-4">
        {kpiCards.map((kpi, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-brand-card p-5 rounded-[2rem] border border-brand-border relative overflow-hidden group hover:border-brand-primary/20 transition-colors"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-brand-primary/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-brand-primary/10 transition-colors" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="p-2.5 rounded-xl bg-brand-bg/80 border border-brand-border">
                <kpi.icon size={18} className="text-brand-primary" />
              </div>
              <span className={`text-[10px] font-bold font-mono ${kpi.change.startsWith('+') ? 'text-brand-primary' : 'text-red-400'}`}>
                {kpi.change}
              </span>
            </div>
            <p className="text-brand-muted text-[10px] uppercase font-mono tracking-widest leading-none mb-2">{kpi.label}</p>
            <h4 className="text-xl font-bold font-mono text-brand-text tracking-tighter">
              {kpi.prefix}{kpi.value.toLocaleString(undefined, { maximumFractionDigits: kpi.label === 'AOV' ? 2 : 0 })}
            </h4>
          </motion.div>
        ))}
      </section>

      {/* Sales Trend Chart */}
      <section className="bg-brand-card p-6 rounded-[2.5rem] border border-brand-border h-72 shadow-xl shadow-black/20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-primary" />
            <h3 className="font-serif text-xl italic text-brand-text">Revenue Stream</h3>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-brand-muted uppercase">7 Days</span>
            <BarChart3 size={16} className="text-brand-muted/40" />
          </div>
        </div>
        <div className="w-full h-44 -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={saleData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--brand-border)" strokeOpacity={0.2} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--brand-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--brand-card)', 
                  border: '1px solid var(--brand-border)', 
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)'
                }}
                itemStyle={{ color: 'var(--brand-primary)' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="var(--brand-primary)" 
                fillOpacity={1} 
                fill="url(#colorValue)" 
                strokeWidth={3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Advanced AI Insights Grid */}
      <section className="grid grid-cols-1 gap-6">
        <div className="bg-brand-card p-6 rounded-[2.5rem] border border-brand-border space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl italic text-brand-secondary">Collection Yield</h3>
            <div className="flex items-center gap-1.5 bg-brand-bg px-2 py-1 rounded-lg border border-brand-border">
              <Sparkles size={10} className="text-brand-primary" />
              <span className="text-[9px] font-mono text-brand-muted uppercase tracking-[0.15em]">AI Segmented</span>
            </div>
          </div>
          
          <div className="h-80 w-full flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 w-full h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--brand-card)', 
                      border: '1px solid var(--brand-border)',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-4 shrink-0 pr-6 border-l border-brand-border/30 pl-6 w-full sm:w-auto">
              {categoryData.map((item, i) => (
                <div key={i} className="flex items-center gap-4 bg-brand-bg/40 p-3 rounded-2xl border border-brand-border group hover:border-brand-primary/30 transition-all">
                  <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: item.color, boxShadow: `0 0 15px ${item.color}60` }} />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-brand-muted uppercase tracking-[0.2em]">{item.name}</span>
                    <span className="text-sm font-bold text-brand-text font-mono tracking-tight">{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-brand-card p-6 rounded-[2rem] border border-brand-border group hover:bg-brand-primary/5 transition-colors">
            <h4 className="text-[10px] font-mono text-brand-muted uppercase tracking-widest mb-4">Retention Rate</h4>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold font-mono text-brand-primary">78.4%</span>
              <ArrowUpRight size={18} className="text-brand-primary mb-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
            <p className="text-[8px] text-brand-muted font-mono mt-3 uppercase tracking-widest border-t border-brand-border pt-2">vs Previous Month</p>
          </div>
          <div className="bg-brand-card p-6 rounded-[2rem] border border-brand-border">
            <h4 className="text-[10px] font-mono text-brand-muted uppercase tracking-widest mb-4">Top Hubs</h4>
            <div className="space-y-3">
              {[
                { city: 'Karachi', rate: '42%' },
                { city: 'Lahore', rate: '28%' }
              ].map((city, i) => (
                <div key={i} className="flex justify-between items-center bg-brand-bg/50 p-2 rounded-xl border border-brand-border/30">
                  <span className="text-[10px] font-mono text-brand-text">{city.city}</span>
                  <span className="text-[10px] font-mono text-brand-primary font-bold">{city.rate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Peak Selling Hours */}
      <section className="bg-brand-card p-6 rounded-[2.5rem] border border-brand-border">
        <h3 className="font-serif text-xl italic mb-6">Peak Selling Hours</h3>
        <div className="h-40 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={PEAK_HOURS}>
              <Bar dataKey="value" fill="var(--brand-primary)" radius={[4, 4, 0, 0]} opacity={0.6} />
              <XAxis dataKey="time" hide />
              <Tooltip cursor={{ fill: 'transparent' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between mt-4 px-2">
          <span className="text-[8px] font-mono text-brand-muted uppercase tracking-widest">Morning</span>
          <span className="text-[8px] font-mono text-brand-primary uppercase tracking-widest font-bold">Peak</span>
          <span className="text-[8px] font-mono text-brand-muted uppercase tracking-widest">Midnight</span>
        </div>
      </section>

      {/* CCTV Store Monitoring Simulation */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <Camera size={20} className="text-brand-primary" />
            <h3 className="font-serif text-xl italic text-brand-text">Visual Intelligence</h3>
          </div>
          <div className="flex items-center gap-2 bg-brand-primary/10 px-4 py-1.5 rounded-full border border-brand-primary/20">
            <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse shadow-[0_0_8px_var(--brand-primary)]" />
            <span className="text-[10px] font-mono text-brand-primary font-bold uppercase tracking-[0.2em]">Live Stream</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="relative aspect-video rounded-[1.5rem] overflow-hidden bg-black group ring-1 ring-white/5">
              <img 
                src={`https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=400&sig=${i}`}
                className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all duration-700"
                alt="CCTV"
              />
              <div className="absolute top-3 left-3 flex flex-col gap-0.5">
                <span className="text-[8px] font-mono text-white/90 bg-black/60 px-1.5 py-0.5 rounded-md uppercase tracking-widest backdrop-blur-md">CAM_{i.toString().padStart(2, '0')}</span>
                <span className="text-[8px] font-mono text-white/40">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="absolute inset-0 border border-white/5 pointer-events-none" />
              {/* Scanline effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,5px_100%] pointer-events-none opacity-40 group-hover:opacity-10 transition-opacity" />
            </div>
          ))}
        </div>
        
        <div className="bg-brand-card p-6 rounded-[2.2rem] border border-brand-border flex items-center justify-between group overflow-hidden relative shadow-lg shadow-black/20">
          <div className="absolute -left-10 top-0 bottom-0 w-24 bg-brand-primary/5 blur-3xl group-hover:translate-x-12 transition-transform duration-1000" />
          <div className="flex flex-col relative z-10">
            <span className="text-[10px] font-mono text-brand-muted uppercase tracking-[0.3em] mb-1">Total Footfall</span>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold font-mono text-brand-text tracking-tighter">{footfall.toLocaleString()}</span>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-brand-primary">
                  <ArrowUpRight size={12} />
                  <span className="text-[10px] font-mono font-bold">+14</span>
                </div>
                <span className="text-[8px] text-brand-muted font-mono uppercase tracking-[0.1em]">Last 15m</span>
              </div>
            </div>
          </div>
          <div className="w-16 h-16 rounded-[1.8rem] bg-brand-bg border border-brand-border flex items-center justify-center relative group-hover:border-brand-primary/30 transition-all">
            <div className={`w-10 h-10 rounded-full border-4 border-brand-primary/10 border-t-brand-primary ${isRefreshing ? 'animate-spin' : ''}`} />
            <Activity size={18} className="absolute text-brand-primary opacity-20" />
          </div>
        </div>
      </section>

      {/* Gargi Monitoring AI Section */}
      <section className="relative overflow-hidden mb-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-brand-card/40 backdrop-blur-3xl p-8 rounded-[3.5rem] border border-brand-primary/20 relative group shadow-2xl shadow-brand-primary/10"
        >
          {/* Animated Background Pulse */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[3.5rem]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] aspect-square bg-[radial-gradient(circle,rgba(74,222,128,0.06)_0%,transparent_70%)] animate-pulse" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-primary blur-xl opacity-20 animate-pulse rounded-full" />
                  <div className="w-16 h-16 bg-brand-bg rounded-[1.8rem] border border-brand-primary/30 flex items-center justify-center shadow-2xl relative z-10">
                    <BrainCircuit size={32} className="text-brand-primary animate-bounce shadow-brand-primary/50" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-serif text-white italic leading-none">Gargi Intelligence</h3>
                  <span className="text-[10px] font-mono text-brand-primary uppercase tracking-[0.4em] font-bold mt-2 inline-block">Active Neural Stream</span>
                </div>
              </div>
              <div className="hidden sm:flex gap-3">
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  className="p-4 bg-brand-bg rounded-2xl text-brand-muted hover:text-brand-primary transition-colors border border-brand-border"
                >
                  <MessageSquare size={20} />
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  className="p-4 bg-brand-primary text-black rounded-2xl border border-brand-primary/20 shadow-lg shadow-brand-primary/30"
                >
                  <Volume2 size={20} />
                </motion.button>
              </div>
            </div>

            <div className="space-y-8">
              <div className="p-8 bg-brand-bg/80 rounded-[2.5rem] border border-brand-border italic relative overflow-hidden group/text shadow-inner">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-primary/40 group-hover/text:bg-brand-primary transition-colors" />
                <p className="text-brand-text text-base leading-relaxed font-serif pl-3">
                  "Greeting Admin. I've analyzed today's patterns. <span className="text-brand-primary font-bold">Revenue is up 12%</span> through targeted morning promos. However, <span className="text-brand-secondary font-bold">Leather Jacket stock</span> is critically low (8 units left). I suggest initiating a restock by tonight."
                </p>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="p-5 bg-brand-card/80 rounded-3xl border border-red-500/20 flex items-center gap-4 group hover:bg-red-500/5 transition-all">
                  <div className="w-2.5 h-2.5 bg-red-400 rounded-full animate-ping" />
                  <span className="text-[10px] font-mono text-red-200 uppercase tracking-widest font-bold">3 Alerts</span>
                </div>
                <div className="p-5 bg-brand-card/80 rounded-3xl border border-brand-primary/20 flex items-center gap-4 group hover:bg-brand-primary/5 transition-all">
                  <div className="w-2.5 h-2.5 bg-brand-primary rounded-full animate-pulse shadow-[0_0_10px_var(--brand-primary)]" />
                  <span className="text-[10px] font-mono text-brand-primary uppercase tracking-widest font-bold">Health 96%</span>
                </div>
              </div>
            </div>
          </div>

          <motion.div 
            className="absolute -bottom-1.5 left-0 right-0 h-1.5 bg-brand-primary/10 overflow-hidden rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            <div className="h-full w-40 bg-brand-primary blur-md" />
          </motion.div>
        </motion.div>
      </section>

    </div>
  );
}
