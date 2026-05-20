import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Smartphone, Lock, Globe, ChevronLeft, Eye, EyeOff, ShieldCheck, User } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { COLORS, FONTS, RADIUS } from '../theme';

export default function Login({ navigation }: any) {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp'>('input');
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({ username: '', email: '', phone: '', password: '', securityCode: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const { setUser, setMode, addNotification, adminPassword, adminSecurityCode } = useStore();

  const isAdminMatch = formData.email.toLowerCase().trim() === 'thegarmentks@gmail.com' && formData.phone === '03333333333' && formData.password === adminPassword;

  const validate = () => {
    if (loginMethod === 'email') {
      if (!formData.email.endsWith('@gmail.com')) { setError('Only valid Gmail addresses are accepted.'); return false; }
      if (formData.password.length < 8) { setError('Password must be at least 8 characters.'); return false; }
    }
    if (formData.phone.replace(/\D/g, '').length !== 11) { setError('Phone number must be exactly 11 digits.'); return false; }
    return true;
  };

  const finalizeAuth = (mode: 'admin' | 'customer', username: string) => {
    const isAdmin = mode === 'admin';
    setMode(mode);
    setUser({ id: Math.random().toString(36).substr(2, 9), username: formData.username || username, name: isAdmin ? 'Master Admin' : (formData.username || username), email: formData.email || (isAdmin ? 'thegarmentks@gmail.com' : 'user@gmail.com'), phone: formData.phone, isAdmin, points: 1200, tier: 'Silver' });
    addNotification({ title: isAdmin ? 'Admin Access Granted' : 'Session Resumed', message: isAdmin ? 'Gargi AI is initializing your dashboard.' : 'Your exclusive shopping session has started.', type: 'info' });
    setIsLoading(false);
  };

  const handleAuth = () => {
    setError('');
    if (!validate()) return;
    setIsLoading(true);
    setTimeout(() => {
      const isAdminLogin = isAdminMatch && formData.securityCode === adminSecurityCode;
      const isIncorrectAdmin = formData.email === 'thegarmentks@gmail.com' && (!isAdminMatch || formData.securityCode !== adminSecurityCode);
      if (isIncorrectAdmin) { setError('Unauthorized administrator access sequence. Verify credentials.'); setIsLoading(false); return; }
      if (!isAdminLogin) {
        addNotification({ title: 'Season Premiere: 25% OFF', message: "Check the new Men's Leather Collection. Use code GARKS-PRUM.", type: 'sale' });
      }
      finalizeAuth(isAdminLogin ? 'admin' : 'customer', isAdminLogin ? 'Admin' : (formData.username || 'Valued Customer'));
    }, 1500);
  };

  const handlePhoneSubmit = () => {
    setError('');
    if (formData.phone.replace(/\D/g, '').length !== 11) { setError('Enter a valid 11-digit phone number.'); return; }
    setIsLoading(true);
    setTimeout(() => { setPhoneStep('otp'); setIsLoading(false); addNotification({ title: 'OTP Sent', message: 'A verification code has been sent to your device.', type: 'info' }); }, 1500);
  };

  const handleOtpVerify = () => {
    if (otp.length !== 6) { setError('Enter the 6-digit verification code.'); return; }
    setIsLoading(true);
    setTimeout(() => finalizeAuth('customer', 'Phone User'), 1500);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => finalizeAuth('customer', 'Google User'), 2000);
  };

  const handleBack = () => {
    if (loginMethod === 'phone' && phoneStep === 'otp') { setPhoneStep('input'); return; }
    if (loginMethod === 'phone') { setLoginMethod('email'); return; }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Background glows */}
        <View style={styles.glowTopRight} />
        <View style={styles.glowBottomLeft} />

        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <ChevronLeft size={20} color={COLORS.muted} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {loginMethod === 'phone' ? (phoneStep === 'otp' ? 'Verify Code' : 'Phone Sign In') : (isSignup ? 'Create account' : 'Exclusive Access')}
          </Text>
          <Text style={styles.headerSub}>
            {loginMethod === 'phone' ? (phoneStep === 'otp' ? 'Enter the security code sent' : 'Enter your mobile identity') : 'Identify yourself to proceed'}
          </Text>
        </View>

        {loginMethod === 'email' ? (
          <View style={styles.form}>
            {isSignup && (
              <View style={styles.inputWrap}>
                <User style={styles.inputIcon} size={18} color={COLORS.muted} />
                <TextInput style={styles.input} placeholder="Username" placeholderTextColor={COLORS.muted} value={formData.username} onChangeText={v => setFormData({ ...formData, username: v })} autoCapitalize="none" />
              </View>
            )}

            <View style={styles.inputWrap}>
              <Mail style={styles.inputIcon} size={18} color={COLORS.muted} />
              <TextInput style={styles.input} placeholder="Gmail Address" placeholderTextColor={COLORS.muted} value={formData.email} onChangeText={v => setFormData({ ...formData, email: v })} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.inputWrap}>
              <Smartphone style={styles.inputIcon} size={18} color={COLORS.muted} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number (11 digits)"
                placeholderTextColor={COLORS.muted}
                value={formData.phone}
                onChangeText={v => setFormData({ ...formData, phone: v.replace(/\D/g, '').slice(0, 11) })}
                keyboardType="phone-pad"
              />
              <Text style={[styles.phoneCounter, formData.phone.length === 11 && styles.phoneCounterDone]}>
                {formData.phone.length}/11
              </Text>
            </View>
            <View style={styles.phoneDots}>
              {[...Array(11)].map((_, i) => (
                <View key={i} style={[styles.phoneDot, i < formData.phone.length ? styles.phoneDotFilled : styles.phoneDotEmpty]} />
              ))}
            </View>

            <View style={styles.inputWrap}>
              <Lock style={styles.inputIcon} size={18} color={COLORS.muted} />
              <TextInput style={styles.input} placeholder="Secure Password" placeholderTextColor={COLORS.muted} value={formData.password} onChangeText={v => setFormData({ ...formData, password: v })} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn} activeOpacity={0.7}>
                {showPassword ? <EyeOff size={16} color={COLORS.muted} /> : <Eye size={16} color={COLORS.muted} />}
              </TouchableOpacity>
            </View>

            {isAdminMatch && (
              <View style={[styles.inputWrap, styles.adminInputWrap]}>
                <Globe style={styles.inputIcon} size={18} color={COLORS.primary} />
                <TextInput style={[styles.input, styles.adminInput]} placeholder="Admin Security Code" placeholderTextColor={`${COLORS.primary}66`} value={formData.securityCode} onChangeText={v => setFormData({ ...formData, securityCode: v })} secureTextEntry={!showPassword} />
              </View>
            )}

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={[styles.primaryBtn, isLoading && styles.btnDisabled]} onPress={handleAuth} disabled={isLoading} activeOpacity={0.85}>
              {isLoading ? <ActivityIndicator color="#000" /> : (
                <>
                  <Text style={styles.primaryBtnText}>{isSignup ? 'Create Account' : 'Authorize Session'}</Text>
                  <ChevronLeft size={18} color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : phoneStep === 'input' ? (
          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <Smartphone style={styles.inputIcon} size={18} color={COLORS.muted} />
              <TextInput style={styles.input} placeholder="Phone (11 Digits)" placeholderTextColor={COLORS.muted} value={formData.phone} onChangeText={v => setFormData({ ...formData, phone: v.replace(/\D/g, '').slice(0, 11) })} keyboardType="phone-pad" />
            </View>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity style={[styles.primaryBtn, (isLoading || formData.phone.length !== 11) && styles.btnDisabled]} onPress={handlePhoneSubmit} disabled={isLoading || formData.phone.length !== 11} activeOpacity={0.85}>
              {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>Send Verification Code</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={[styles.inputWrap, styles.adminInputWrap]}>
              <ShieldCheck style={styles.inputIcon} size={18} color={COLORS.primary} />
              <TextInput style={[styles.input, styles.adminInput, { letterSpacing: 8, textAlign: 'center' }]} placeholder="6-Digit OTP" placeholderTextColor={`${COLORS.primary}66`} value={otp} onChangeText={v => setOtp(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} />
            </View>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity style={[styles.primaryBtn, (isLoading || otp.length !== 6) && styles.btnDisabled]} onPress={handleOtpVerify} disabled={isLoading || otp.length !== 6} activeOpacity={0.85}>
              {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>Verify & Enter</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPhoneStep('input')} style={{ alignSelf: 'center' }}>
              <Text style={styles.linkText}>Resend Code or Change Number</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity onPress={() => { setIsSignup(!isSignup); setLoginMethod('email'); }} style={styles.switchLink}>
          <Text style={styles.linkText}>{isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Alternative Gateways</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social buttons */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin} disabled={isLoading} activeOpacity={0.75}>
            <Globe size={22} color={COLORS.muted} />
            <Text style={styles.socialBtnText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, loginMethod === 'phone' && styles.socialBtnActive]} onPress={() => { setLoginMethod('phone'); setPhoneStep('input'); }} disabled={isLoading} activeOpacity={0.75}>
            <Smartphone size={22} color={loginMethod === 'phone' ? COLORS.primary : COLORS.muted} />
            <Text style={[styles.socialBtnText, loginMethod === 'phone' && { color: COLORS.primary }]}>Phone SMS</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>GarKS Secure Verification System{'\n'}Neural Safeguard Active</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 28, gap: 0 },
  glowTopRight: { position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: `${COLORS.primary}14` },
  glowBottomLeft: { position: 'absolute', bottom: -80, left: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: `${COLORS.secondary}14` },
  backBtn: { width: 44, height: 44, backgroundColor: COLORS.card, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  header: { gap: 8, marginBottom: 32 },
  headerTitle: { fontFamily: FONTS.serifItalic, fontSize: 42, color: COLORS.text, letterSpacing: -1 },
  headerSub: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 4 },
  form: { gap: 14, marginBottom: 24 },
  inputWrap: { backgroundColor: `${COLORS.card}cc`, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS['3xl'], paddingVertical: 18, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  adminInputWrap: { backgroundColor: `${COLORS.primary}0a`, borderColor: `${COLORS.primary}44`, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
  inputIcon: {},
  input: { flex: 1, fontFamily: FONTS.mono, fontSize: 13, color: COLORS.text },
  adminInput: { color: COLORS.primary },
  phoneCounter: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted },
  phoneCounterDone: { color: COLORS.primary },
  phoneDots: { flexDirection: 'row', gap: 4, paddingHorizontal: 20, opacity: 0.5 },
  phoneDot: { height: 1.5, flex: 1 },
  phoneDotFilled: { backgroundColor: COLORS.primary },
  phoneDotEmpty: { backgroundColor: COLORS.muted },
  eyeBtn: { padding: 4 },
  errorText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.danger, textTransform: 'uppercase', letterSpacing: 2, paddingHorizontal: 4 },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS['3xl'], paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontFamily: FONTS.mono, fontSize: 11, color: '#000', textTransform: 'uppercase', letterSpacing: 3, fontWeight: '700' },
  switchLink: { alignSelf: 'center', paddingVertical: 8, marginBottom: 24 },
  linkText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  dividerText: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 3 },
  socialRow: { flexDirection: 'row', gap: 14, marginBottom: 40 },
  socialBtn: { flex: 1, backgroundColor: `${COLORS.card}66`, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS['2xl'], paddingVertical: 24, alignItems: 'center', gap: 10 },
  socialBtnActive: { backgroundColor: `${COLORS.primary}0d`, borderColor: `${COLORS.primary}44` },
  socialBtnText: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2 },
  footer: { textAlign: 'center', fontFamily: FONTS.mono, fontSize: 8, color: `${COLORS.muted}66`, lineHeight: 16, textTransform: 'uppercase', letterSpacing: 3, fontStyle: 'italic' },
});
