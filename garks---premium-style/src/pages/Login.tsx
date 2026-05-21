import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { Smartphone, Mail, Globe, User, Lock, ArrowRight, ChevronLeft, Eye, EyeOff, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp'>('input');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    securityCode: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser, setMode, addNotification, adminPassword, adminSecurityCode } = useStore();
  const [isLoading, setIsLoading] = useState(false);

  const isAdminCredentialMatch = 
    formData.email.toLowerCase().trim() === 'thegarmentks@gmail.com' && 
    formData.phone === '03333333333' && 
    formData.password === adminPassword;

  const validate = () => {
    if (loginMethod === 'email') {
      if (!formData.email.endsWith('@gmail.com')) {
        setError('Only valid Gmail addresses are accepted.');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters.');
        return false;
      }
    }
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 11) {
      setError('Phone number must be exactly 11 digits.');
      return false;
    }
    return true;
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 11) {
      setError('Enter a valid 11-digit phone number.');
      return;
    }
    setIsLoading(true);
    // Simulate sending OTP
    setTimeout(() => {
      setPhoneStep('otp');
      setIsLoading(false);
      addNotification({
        title: "OTP Sent",
        message: "A verification code has been sent to your device.",
        type: 'info'
      });
    }, 1500);
  };

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Enter the 6-digit verification code.');
      return;
    }
    setIsLoading(true);
    // Simulate OTP verification
    setTimeout(() => {
      finalizeAuth('customer', 'Phone User');
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Simulate Google OAuth
    setTimeout(() => {
      finalizeAuth('customer', 'Google User');
    }, 2000);
  };

  const finalizeAuth = (mode: 'admin' | 'customer', username: string) => {
    const isAdmin = mode === 'admin';
    setMode(mode);
    setUser({
      id: Math.random().toString(36).substr(2, 9),
      username: formData.username || username,
      name: isAdmin ? 'Master Admin' : (formData.username || username),
      email: formData.email || (isAdmin ? 'thegarmentks@gmail.com' : 'user@gmail.com'),
      phone: formData.phone,
      isAdmin: isAdmin,
      points: 1200,
      tier: 'Silver'
    });
    
    addNotification({
      title: isAdmin ? "Admin Access Granted" : "Session Resumed",
      message: isAdmin ? "Gargi AI is initializing your dashboard." : "Your exclusive shopping session has started.",
      type: 'info'
    });

    navigate(isAdmin ? '/admin' : '/customer');
    setIsLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validate()) return;

    setIsLoading(true);
    
    // Simulate auth
    setTimeout(() => {
      const isAdminLogin = 
        isAdminCredentialMatch && 
        formData.securityCode === adminSecurityCode;
      
      const isIncorrectAdmin = 
        formData.email === 'thegarmentks@gmail.com' && 
        (!isAdminCredentialMatch || formData.securityCode !== adminSecurityCode);

      if (isIncorrectAdmin) {
        setError('Unauthorized administrator access sequence. Please verify credentials.');
        setIsLoading(false);
        return;
      }

      const mode = isAdminLogin ? 'admin' : 'customer';
      
      setMode(mode);
      setUser({
        id: Math.random().toString(36).substr(2, 9),
        username: formData.username || (isAdminLogin ? 'Admin' : 'Guest'),
        name: isAdminLogin ? 'Master Admin' : (formData.username || 'Valued Customer'),
        email: formData.email,
        phone: formData.phone,
        isAdmin: isAdminLogin,
        points: 1200,
        tier: 'Silver'
      });
      
      addNotification({
        title: isAdminLogin ? "Admin Access Granted" : (isSignup ? "Welcome to GarKS" : "Session Resumed"),
        message: isAdminLogin ? "Gargi AI is initializing your dashboard." : "Your exclusive shopping session has started.",
        type: 'info'
      });

      if (!isAdminLogin) {
        addNotification({
          title: "Season Premiere: 25% OFF",
          message: "Check the new Men's Leather Collection. Use code GARKS-PRUM.",
          type: 'sale'
        });
      }

      navigate(isAdminLogin ? '/admin' : '/customer');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col bg-brand-bg relative overflow-hidden h-screen overflow-y-auto no-scrollbar">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/10 rounded-full blur-[100px] -mr-40 -mt-40 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-secondary/10 rounded-full blur-[100px] -ml-40 -mb-40 animate-pulse" />

      <div className="flex-1 flex flex-col px-8 pt-16 relative z-10">
        <header className="mb-12">
          {loginMethod === 'phone' && phoneStep === 'otp' ? (
            <button 
              onClick={() => setPhoneStep('input')} 
              className="mb-8 p-3 bg-brand-card rounded-2xl text-brand-muted hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          ) : (
            <button 
              onClick={() => loginMethod === 'phone' ? setLoginMethod('email') : navigate('/')} 
              className="mb-8 p-3 bg-brand-card rounded-2xl text-brand-muted hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-5xl font-serif text-brand-text mb-2 italic">
              {loginMethod === 'phone' 
                ? (phoneStep === 'otp' ? 'Verify Code' : 'Phone Sign In')
                : (isSignup ? 'Create account' : 'Exclusive Access')}
            </h1>
            <p className="text-brand-muted text-[10px] font-mono uppercase tracking-[0.4em]">
              {loginMethod === 'phone' 
                ? (phoneStep === 'otp' ? 'Enter the security code sent' : 'Enter your mobile identity')
                : 'Identify yourself to proceed'}
            </p>
          </motion.div>
        </header>

        {loginMethod === 'email' ? (
          <form onSubmit={handleAuth} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {isSignup && (
                <div className="relative group">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-primary transition-colors" size={18} />
                  <input 
                    required
                    type="text" 
                    placeholder="Username" 
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full bg-brand-card/50 backdrop-blur-xl border border-white/5 rounded-3xl py-6 pl-16 pr-6 text-brand-text outline-none focus:border-brand-primary/50 transition-all font-mono text-xs"
                  />
                </div>
              )}

              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-primary transition-colors" size={18} />
                <input 
                  required
                  type="email" 
                  placeholder="Gmail Address" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-brand-card/50 backdrop-blur-xl border border-white/5 rounded-3xl py-6 pl-16 pr-6 text-brand-text outline-none focus:border-brand-primary/50 transition-all font-mono text-xs"
                />
              </div>

                <div className="relative group">
                  <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-primary transition-colors" size={18} />
                  <input 
                    required
                    type="tel" 
                    placeholder="Phone Number" 
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setFormData({...formData, phone: val});
                    }}
                    className="w-full bg-brand-card/50 backdrop-blur-xl border border-white/5 rounded-3xl py-6 pl-16 pr-12 text-brand-text outline-none focus:border-brand-primary/50 transition-all font-mono text-xs"
                  />
                  {/* Digital Line Indicators (11 lines) */}
                  <div className="absolute left-16 bottom-3 flex gap-1 pointer-events-none opacity-40">
                    {[...Array(11)].map((_, i) => (
                      <div 
                        key={`phone-dot-auth-${i}`} 
                        className={`h-[1px] w-3 transition-all duration-300 ${i < formData.phone.length ? 'bg-brand-primary' : 'bg-brand-muted'}`} 
                      />
                    ))}
                  </div>
                  <div className={`absolute right-6 top-1/2 -translate-y-1/2 font-mono text-[8px] transition-colors ${formData.phone.length === 11 ? 'text-brand-primary' : 'text-brand-muted'}`}>
                    {formData.phone.length}/11
                  </div>
                </div>

              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-primary transition-colors" size={18} />
                <input 
                  required
                  type={showPassword ? "text" : "password"} 
                  placeholder="Secure Password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-brand-card/50 backdrop-blur-xl border border-white/5 rounded-3xl py-6 pl-16 pr-12 text-brand-text outline-none focus:border-brand-primary/50 transition-all font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {isAdminCredentialMatch && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="relative group pt-2"
                >
                  <div className="relative">
                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-primary animate-pulse" size={18} />
                    <input 
                      required={isAdminCredentialMatch}
                      type={showPassword ? "text" : "password"} 
                      placeholder="Admin Security Code" 
                      value={formData.securityCode}
                      onChange={(e) => setFormData({...formData, securityCode: e.target.value})}
                      className="w-full bg-brand-primary/5 border border-brand-primary/30 rounded-3xl py-6 pl-16 pr-6 text-brand-primary outline-none focus:border-brand-primary shadow-[0_0_15px_rgba(63,185,80,0.1)] transition-all font-mono text-xs placeholder:text-brand-primary/40"
                    />
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-400 text-[10px] font-mono uppercase tracking-widest px-2"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="pt-4"
            >
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-primary text-black font-bold py-6 rounded-3xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(63,185,80,0.2)] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="font-mono text-xs uppercase tracking-widest">
                      {isSignup ? 'Create Account' : 'Authorize Session'}
                    </span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </motion.div>
          </form>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {phoneStep === 'input' ? (
                <motion.form 
                  key="phone-input"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handlePhoneSubmit} 
                  className="space-y-6"
                >
                  <div className="relative group">
                    <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-primary transition-colors" size={18} />
                    <input 
                      required
                      type="tel" 
                      placeholder="Phone (11 Digits)" 
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setFormData({...formData, phone: val});
                      }}
                      className="w-full bg-brand-card/50 backdrop-blur-xl border border-white/5 rounded-3xl py-6 pl-16 pr-12 text-brand-text outline-none focus:border-brand-primary/50 transition-all font-mono text-xs"
                    />
                    <div className="absolute left-16 bottom-3 flex gap-1 pointer-events-none opacity-40">
                      {[...Array(11)].map((_, i) => (
                        <div 
                          key={`phone-dot-login-${i}`} 
                          className={`h-[1px] w-3 transition-all duration-300 ${i < formData.phone.length ? 'bg-brand-primary' : 'bg-brand-muted'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isLoading || formData.phone.length !== 11}
                    className="w-full bg-brand-primary text-black font-bold py-6 rounded-3xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all font-mono text-xs uppercase tracking-widest"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : 'Send Verification Code'}
                  </button>
                </motion.form>
              ) : (
                <motion.form 
                  key="otp-input"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleOtpVerify} 
                  className="space-y-6"
                >
                  <div className="relative group">
                    <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-primary" size={18} />
                    <input 
                      required
                      type="text" 
                      maxLength={6}
                      placeholder="6-Digit OTP" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-brand-primary/5 border border-brand-primary/30 rounded-3xl py-6 pl-16 pr-6 text-brand-primary outline-none focus:border-brand-primary shadow-[0_0_15px_rgba(63,185,80,0.1)] transition-all font-mono text-sm tracking-[0.5em] text-center"
                    />
                  </div>

                  {error && <p className="text-red-400 text-[10px] font-mono uppercase tracking-widest text-center">{error}</p>}
                  
                  <button 
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full bg-brand-primary text-black font-bold py-6 rounded-3xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all font-mono text-xs uppercase tracking-widest"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : 'Verify & Enter'}
                  </button>

                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={() => setPhoneStep('input')}
                      className="text-brand-muted text-[8px] font-mono uppercase tracking-widest hover:text-brand-primary transition-colors"
                    >
                      Resend Code or Change Number
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-8 text-center px-4">
          <button 
            onClick={() => {
              setIsSignup(!isSignup);
              setLoginMethod('email');
            }}
            className="text-brand-muted text-[10px] font-mono uppercase tracking-[0.2em] hover:text-brand-primary transition-colors"
          >
            {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="mt-12 space-y-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
            <div className="relative flex justify-center text-[8px]"><span className="bg-brand-bg px-4 text-brand-muted font-mono uppercase tracking-[0.4em]">Alternative Gateways</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="flex flex-col items-center gap-4 bg-brand-card/30 p-8 rounded-[2rem] border border-white/5 hover:border-brand-primary/30 transition-all group disabled:opacity-50"
            >
              <Globe className="text-brand-muted group-hover:text-brand-primary transition-colors" size={24} />
              <span className="text-[8px] font-mono text-brand-muted uppercase tracking-widest">Google Sign In</span>
            </button>
            <button 
              onClick={() => {
                setLoginMethod('phone');
                setPhoneStep('input');
              }}
              disabled={isLoading}
              className={`flex flex-col items-center gap-4 p-8 rounded-[2rem] border transition-all group disabled:opacity-50 ${
                loginMethod === 'phone' ? 'bg-brand-primary/5 border-brand-primary/30' : 'bg-brand-card/30 border-white/5 hover:border-brand-primary/30'
              }`}
            >
              <Smartphone className={`transition-colors ${loginMethod === 'phone' ? 'text-brand-primary' : 'text-brand-muted group-hover:text-brand-primary'}`} size={24} />
              <span className={`text-[8px] font-mono uppercase tracking-widest ${loginMethod === 'phone' ? 'text-brand-primary' : 'text-brand-muted'}`}>Phone SMS</span>
            </button>
          </div>
        </div>
      </div>

      <footer className="p-12 text-center relative z-10">
        <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-brand-muted leading-relaxed italic opacity-40">
          GarKS Secure Verification System<br />
          <span className="text-brand-primary">Neural Safeguard Active</span>
        </p>
      </footer>
    </div>
  );
}
