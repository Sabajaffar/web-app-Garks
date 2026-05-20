import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, Shield, Moon, Globe, 
  Bell, FileLock2, Info, LogOut, 
  ChevronRight, Camera, RefreshCw, Award, Gem, Crown, Heart, ShoppingBag, Truck,
  Lock, Sparkles
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { haptic } from '../lib/utils';

export default function Profile() {
  const { user, mode, setMode, logout, theme, setTheme } = useStore();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleModeSwitch = () => {
    haptic('medium');
    const newMode = mode === 'customer' ? 'admin' : 'customer';
    setMode(newMode);
    navigate(newMode === 'admin' ? '/admin' : '/customer');
  };

  const toggleTheme = () => {
    haptic('light');
    const themes: ('dark' | 'light' | 'premium-gold')[] = ['dark', 'light', 'premium-gold'];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const menuItems = [
    { 
      label: 'Concierge Assistant', 
      icon: Sparkles, 
      value: 'Personalized',
      onClick: () => {
        haptic('medium');
        // This could open the Gargi modal in a specific "Assistant" view if needed
        // For now, we'll just indicate it's here
      }
    },
    { 
      label: 'Appearance', 
      icon: Moon, 
      value: theme === 'premium-gold' ? 'Premium Gold' : theme === 'dark' ? 'Midnight Navy' : 'Alabaster Light',
      onClick: toggleTheme 
    },
    { 
      label: 'Notifications', 
      icon: Bell, 
      value: notificationsEnabled ? 'Active' : 'Muted',
      onClick: () => {
        haptic('light');
        setNotificationsEnabled(!notificationsEnabled);
      }
    },
    { label: 'Language', icon: Globe, value: 'English (UK)' },
    { label: 'Privacy Policy', icon: FileLock2, path: '/privacy' },
  ];

  const { adminPassword, setAdminPassword, adminSecurityCode, setAdminSecurityCode, lockAdmin, setToast } = useStore();
  const [newPassword, setNewPassword] = useState(adminPassword);
  const [newSecurityCode, setNewSecurityCode] = useState(adminSecurityCode);
  const [isEditingSecurity, setIsEditingSecurity] = useState(false);

  const handleUpdateSecurity = () => {
    haptic('medium');
    setAdminPassword(newPassword);
    setAdminSecurityCode(newSecurityCode);
    setIsEditingSecurity(false);
    setToast('Security Protocols Updated');
  };

  const handleLock = () => {
    haptic('heavy');
    lockAdmin();
    setToast('Admin Terminal Locked');
  };

  const confirmLogout = () => {
    haptic('heavy');
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col pb-32">
      <PageHeader title="Atelier" subtitle="Manage your profile & preferences" showBack />
      
      <div className="px-6 space-y-10 pt-4">
        {/* Profile Header */}
        <div className="flex flex-col items-center gap-6 py-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[3.5rem] border-[1px] border-brand-secondary/30 p-2 bg-brand-card flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(224,201,168,0.1)] relative z-10">
              {user?.photo ? (
                <img src={user.photo} className="w-full h-full object-cover rounded-[2.8rem]" alt="Profile" />
              ) : (
                <div className="w-full h-full bg-brand-bg rounded-[2.8rem] flex items-center justify-center">
                  <User size={48} strokeWidth={1} className="text-brand-muted/20" />
                </div>
              )}
            </div>
            <button className="absolute -bottom-1 -right-1 bg-brand-secondary text-brand-bg p-3 rounded-2xl border-4 border-brand-bg shadow-xl z-20 active:scale-90 transition-all">
              <Camera size={16} strokeWidth={2} />
            </button>
            <div className="absolute inset-0 bg-brand-secondary/5 blur-[50px] rounded-full opacity-60 -z-0" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-serif text-brand-text italic">{user?.name}</h2>
            <div className="flex items-center justify-center gap-3">
              <span className="text-[9px] font-mono text-brand-muted uppercase tracking-[0.4em] font-bold">
                {user?.isAdmin ? 'GarKS Executive' : `Honorary House Member`}
              </span>
              <div className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-pulse" />
              <span className="text-[9px] font-mono text-brand-secondary font-bold uppercase tracking-[0.2em]">{user?.points || 0} Points</span>
            </div>
          </div>
        </div>

        {/* Admin Mode Switcher - ONLY visible for Admin Users */}
        {user?.isAdmin && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="bg-brand-card p-8 rounded-[3rem] border border-brand-primary/10 flex flex-col gap-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 rounded-full blur-[80px] -mr-24 -mt-24 group-hover:bg-brand-primary/10 transition-colors duration-1000" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[1.5rem] bg-brand-bg flex items-center justify-center border border-white/5">
                    <RefreshCw className={`text-brand-primary ${mode === 'admin' ? 'rotate-0' : 'rotate-180'} transition-transform duration-[1500ms]`} size={22} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-bold uppercase font-mono tracking-widest text-brand-text">
                      {mode === 'admin' ? 'Customer Experience' : 'Executive Dashboard'}
                    </h4>
                    <p className="text-[9px] text-brand-muted font-mono uppercase tracking-[0.2em]">
                      {mode === 'admin' ? 'View storefront' : 'Access core ops'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleModeSwitch}
                  className="bg-brand-primary text-black px-8 py-3 rounded-full text-[10px] font-bold font-mono uppercase tracking-widest shadow-xl shadow-brand-primary/10 active:scale-95 transition-all"
                >
                  {mode === 'admin' ? 'View' : 'Restore'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Menu List */}
        <section className="space-y-6">
          <div className="px-2 flex items-center justify-between">
            <h3 className="font-serif text-2xl italic text-brand-text">Preferences</h3>
          </div>
          <div className="bg-brand-card rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
            {menuItems.map((item, i) => (
              <button 
                key={i}
                onClick={() => {
                  if (item.onClick) item.onClick();
                  else if (item.path) navigate(item.path);
                }}
                className="w-full px-8 py-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0 group"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-brand-bg rounded-2xl border border-white/5 flex items-center justify-center group-hover:border-brand-secondary/30 transition-colors">
                    <item.icon size={20} strokeWidth={1.5} className="text-brand-muted group-hover:text-brand-secondary transition-colors" />
                  </div>
                  <span className="text-brand-text text-sm font-medium tracking-tight">{item.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  {item.value && (
                    <span className="text-[9px] text-brand-muted/60 font-mono uppercase tracking-[0.2em] bg-brand-bg/50 px-3 py-1.5 rounded-lg border border-white/5">
                      {item.value}
                    </span>
                  )}
                  <ChevronRight size={16} strokeWidth={1} className="text-brand-muted/20 group-hover:text-brand-secondary group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Security Administration - ONLY for Admin mode */}
        {user?.isAdmin && mode === 'admin' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-serif text-2xl italic text-brand-text">Executive Security</h3>
              <button 
                onClick={handleLock}
                className="flex items-center gap-2 px-4 py-2 bg-brand-primary/5 rounded-xl border border-brand-primary/20 text-brand-primary active:scale-95 transition-all"
              >
                <FileLock2 size={14} />
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em]">Lock Terminal</span>
              </button>
            </div>
            
            <div className="bg-brand-card p-10 rounded-[3rem] border border-white/5 space-y-10 relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary/10" />
               
               {/* Password Field */}
               <div className="flex flex-col gap-4">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-brand-muted uppercase tracking-[0.3em] font-bold">Encrypted Auth Code</span>
                    {!isEditingSecurity ? (
                      <button 
                        onClick={() => setIsEditingSecurity(true)}
                        className="text-[9px] font-mono text-brand-secondary font-bold uppercase tracking-[0.2em] hover:brightness-125"
                      >
                        Recalibrate
                      </button>
                    ) : (
                      <div className="flex gap-6">
                        <button 
                          onClick={() => {
                            setIsEditingSecurity(false);
                            setNewPassword(adminPassword);
                            setNewSecurityCode(adminSecurityCode);
                          }}
                          className="text-[9px] font-mono text-brand-muted uppercase tracking-widest"
                        >
                          Revoke
                        </button>
                        <button 
                          onClick={handleUpdateSecurity}
                          className="text-[9px] font-mono text-brand-secondary font-bold uppercase tracking-widest"
                        >
                          Commit
                        </button>
                      </div>
                    )}
                 </div>

                 {isEditingSecurity ? (
                   <input 
                     type="text"
                     value={newPassword}
                     onChange={(e) => setNewPassword(e.target.value)}
                     className="w-full bg-brand-bg border border-brand-secondary/20 rounded-2xl py-5 px-8 text-brand-text font-mono placeholder:text-brand-muted/20 focus:outline-none focus:ring-1 ring-brand-secondary/40 transition-all mb-4 text-xs"
                     placeholder="New Password"
                   />
                 ) : (
                   <div className="w-full bg-brand-bg/30 border border-white/5 rounded-2xl py-5 px-8 flex items-center justify-between">
                     <span className="font-mono text-brand-text/20 tracking-[0.8em] text-xs">
                       ●●●●●●●●●●
                     </span>
                     <Lock size={18} strokeWidth={1} className="text-brand-muted/10" />
                   </div>
                 )}
               </div>

               {/* Security Code Field */}
               <div className="flex flex-col gap-4 pt-10 border-t border-white/5">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-brand-muted uppercase tracking-[0.3em] font-bold">Secondary Key</span>
                 </div>

                 {isEditingSecurity ? (
                   <input 
                     type="text"
                     value={newSecurityCode}
                     onChange={(e) => setNewSecurityCode(e.target.value)}
                     className="w-full bg-brand-bg border border-brand-secondary/20 rounded-2xl py-5 px-8 text-brand-text font-mono placeholder:text-brand-muted/20 focus:outline-none focus:ring-1 ring-brand-secondary/40 transition-all text-xs"
                     placeholder="New Security Code"
                   />
                 ) : (
                   <div className="w-full bg-brand-bg/30 border border-white/5 rounded-2xl py-5 px-8 flex items-center justify-between">
                     <span className="font-mono text-brand-text/20 tracking-[0.8em] text-xs">
                       ●●●●●●●●●●
                     </span>
                     <Shield size={18} strokeWidth={1} className="text-brand-muted/10" />
                   </div>
                 )}
                 
                 <p className="text-[9px] text-brand-muted font-mono leading-relaxed mt-6 opacity-40 italic text-center max-w-xs mx-auto">
                   Calibrating these protocols will sync identity with +92 333 3333333.
                 </p>
               </div>
            </div>
          </section>
        )}

        {/* Logout */}
        <div className="pt-6">
          {!showLogoutConfirm ? (
            <button 
              onClick={() => {
                haptic('light');
                setShowLogoutConfirm(true);
              }}
              className="w-full bg-red-400/5 text-red-300 font-bold py-8 rounded-[3rem] flex items-center justify-center gap-4 hover:bg-red-400/10 transition-all border border-red-400/10 active:scale-95 duration-300"
            >
              <LogOut size={22} strokeWidth={1.5} />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold">Terminate Session</span>
            </button>
          ) : (
            <div className="bg-red-400/10 border border-red-400/20 p-8 rounded-[3rem] animate-in zoom-in-95 duration-300 shadow-2xl">
              <p className="text-red-300 text-center font-mono text-[10px] uppercase tracking-[0.2em] mb-6 font-bold">Confirm evacuation of ateliers?</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-5 bg-brand-bg text-brand-text rounded-2xl font-mono text-[10px] uppercase tracking-widest border border-white/5 active:scale-95 transition-all"
                >
                  Stay
                </button>
                <button 
                  onClick={confirmLogout}
                  className="flex-1 py-5 bg-red-500 text-white rounded-2xl font-mono text-[10px] uppercase tracking-widest font-bold shadow-xl shadow-red-500/30 active:scale-95 transition-all"
                >
                  Exit
                </button>
              </div>
            </div>
          )}
        </div>

        <footer className="text-center py-12 flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-4 w-full">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-brand-border" />
            <h1 className="font-serif text-5xl text-brand-text italic leading-none opacity-40">GarKS</h1>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-brand-border" />
          </div>
          <p className="text-[9px] font-mono uppercase tracking-[0.8em] opacity-30 mt-2">Architecture. Style. Intelligence.</p>
          <div className="pt-4 space-y-1">
            <p className="text-[7px] font-mono uppercase tracking-[0.2em] opacity-20">Cloud Production V2.8.4-B</p>
            <p className="text-[7px] font-mono uppercase tracking-[0.2em] opacity-20">Encrypted in the GarKS Atelier</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
