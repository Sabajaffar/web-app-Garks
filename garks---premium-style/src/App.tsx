/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from './store/useStore';
import Splash from './pages/Splash';
import Login from './pages/Login';
import Privacy from './pages/Privacy';
import About from './pages/About';
import Notifications from './pages/customer/Notifications';
import TopBanner from './components/TopBanner';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

function ExitConfirmation() {
  const location = useLocation();
  
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Do you want to stay or leave?";
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return null;
}

export default function App() {
  const { isLoggedIn, mode, toast, theme, flyPos } = useStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'premium-gold');
    if (theme !== 'dark') {
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  return (
    <Router>
      <ExitConfirmation />
      
      <div className="flex items-center justify-center min-h-screen bg-black overflow-hidden px-4">
        {/* Fly Effect Indicator */}
        <AnimatePresence>
          {flyPos && (
            <motion.div
              initial={{ x: flyPos.x, y: flyPos.y, scale: 1, opacity: 1 }}
              animate={{ x: window.innerWidth / 2, y: window.innerHeight - 80, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.6, ease: "circIn" }}
              className="fixed z-[999] pointer-events-none"
            >
              <div className="w-4 h-4 bg-brand-primary rounded-full shadow-[0_0_20px_#3fb950]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Frame Simulation */}
        <div className="relative h-[92vh] max-h-[850px] aspect-[9/19.5] w-auto bg-brand-bg rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8),0_0_80px_rgba(74,222,128,0.05)] border-[12px] border-[#1a2e28] overflow-hidden flex flex-col ring-1 ring-white/5 relative z-10 transition-colors duration-700">
          <TopBanner />
          
          {/* Dynamic Toast System */}
          <AnimatePresence>
            {toast?.visible && (
              <motion.div
                initial={{ opacity: 0, y: -40, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -40, x: '-50%' }}
                className="absolute top-24 left-1/2 z-[100] px-8 py-3 bg-brand-primary text-black rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border border-white/20"
              >
                <div className="w-5 h-5 bg-black/10 rounded-full flex items-center justify-center">
                  <Sparkles size={12} />
                </div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">{toast.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Bar Mock */}
          <div className="h-10 w-full bg-brand-bg flex items-center justify-between px-8 text-xs font-mono text-brand-muted shrink-0 z-50">
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border border-brand-muted flex items-center justify-center text-[8px]">5G</div>
              <div className="w-6 h-3 border border-brand-muted rounded-sm relative">
                <div className="absolute right-[-2px] top-1/2 -translate-y-1/2 w-1 h-1.5 bg-brand-muted rounded-r-xs" />
                <div className="m-[1px] h-[calc(100%-2px)] w-4 bg-brand-primary rounded-xs" />
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!hydrated ? (
              <div className="flex-1 flex items-center justify-center bg-brand-bg">
                <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <Routes>
                <Route 
                  path="/" 
                  element={isLoggedIn ? (mode === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/customer" />) : <Splash />} 
                />
                <Route 
                  path="/login" 
                  element={isLoggedIn ? (mode === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/customer" />) : <Login />} 
                />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/about" element={<About />} />
                <Route 
                  path="/customer/*" 
                  element={isLoggedIn ? <CustomerLayout /> : <Navigate to="/login" />} 
                />
                
                <Route 
                  path="/admin/*" 
                  element={(isLoggedIn && mode === 'admin') ? <AdminLayout /> : <Navigate to="/customer" />} 
                />

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            )}
          </AnimatePresence>

          {/* Home Indicator */}
          <div className="h-8 w-full bg-transparent flex items-center justify-center shrink-0">
            <div className="w-32 h-1 bg-brand-muted/20 rounded-full" />
          </div>
        </div>
      </div>
    </Router>
  );
}

