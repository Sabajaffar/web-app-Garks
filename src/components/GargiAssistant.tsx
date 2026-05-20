import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Easing, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Send, X, Mic, BrainCircuit, Sparkles, MicOff, ShoppingBag, Zap, Package } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { COLORS, FONTS, RADIUS } from '../theme';
import { API_BASE, MOCK_API_BASE } from '../config';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  isAgentResult?: boolean;
  agentData?: any;
  showApprovalButtons?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'declined';
  isRestockRecommendation?: boolean;
  restockCategory?: string;
  isMarketingRecommendation?: boolean;
  marketingTip?: string;
  isPerformanceReport?: boolean;
  performanceSummary?: string;
  isFlashSaleRecommendation?: boolean;
}

const ADMIN_WELCOME = `GarKS Intelligence Hub.\n\nI'm Gargi — your retail AI advisor. Ask about stock levels, revenue, or run a full agent analysis.\n\nHow can I help optimize the store today?`;
const CUSTOMER_WELCOME = `Welcome to GarKS.\n\nI'm Gargi, your personal fashion concierge. I'm here to help you discover beautiful pieces, suggest outfits, and answer style questions.\n\nWhat can I help you find today?`;

const ADMIN_QUICK_ACTIONS = ['Run Agent Analysis', 'Check Stock Levels', 'View Agent Logs'];
const CUSTOMER_QUICK_ACTIONS = ['New Arrivals', 'Outfit Ideas', 'Find My Size', 'Track My Order'];

const SKELETON_WIDTHS = ['88%', '70%', '92%', '55%'];

const apiCache = new Map<string, { text: string; ts: number }>();
const CACHE_TTL = 20 * 60 * 1000;

function getCached(key: string): string | null {
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { apiCache.delete(key); return null; }
  return entry.text;
}
function setCache(key: string, text: string) { apiCache.set(key, { text, ts: Date.now() }); }

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}

function SkeletonLoader() {
  const shimmer = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.9, duration: 750, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.25, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={skStyles.wrap}>
      <View style={skStyles.header}>
        <Animated.View style={[skStyles.dot, { opacity: shimmer }]} />
        <Animated.View style={[skStyles.headerLine, { opacity: shimmer }]} />
      </View>
      {SKELETON_WIDTHS.map((w, i) => (
        <Animated.View key={i} style={[skStyles.line, { width: w as any, opacity: shimmer, marginTop: i === 0 ? 10 : 6 }]} />
      ))}
    </View>
  );
}

const skStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 14, gap: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.secondary },
  headerLine: { height: 8, width: 100, backgroundColor: `${COLORS.secondary}60`, borderRadius: 4 },
  line: { height: 9, backgroundColor: `${COLORS.muted}40`, borderRadius: 5 },
});

export default function GargiAssistant({ navigation }: any) {
  const { user, mode, gargiOpen, setGargiOpen, inventory, saleRecommendedByAI, orderedCategories, orderRestock, cancelRestock, addCampaign } = useStore();
  const isAdmin = mode === 'admin';

  const [history, setHistory] = useState<ChatMessage[]>([
    { role: 'ai', text: isAdmin ? ADMIN_WELCOME : CUSTOMER_WELCOME }
  ]);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(600)).current;
  const prevModeRef = useRef(mode);

  const lowStockCount = inventory.filter(p => p.stock < 5).length;
  const hasBadge = lowStockCount > 0 || saleRecommendedByAI;

  // Reset history when mode switches
  useEffect(() => {
    if (gargiOpen && prevModeRef.current !== mode) {
      setHistory([{ role: 'ai', text: isAdmin ? ADMIN_WELCOME : CUSTOMER_WELCOME }]);
      prevModeRef.current = mode;
    }
  }, [gargiOpen, mode]);

  useEffect(() => {
    if (gargiOpen) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 600, duration: 240, useNativeDriver: true, easing: Easing.in(Easing.ease) }).start();
    }
  }, [gargiOpen]);

  useEffect(() => {
    if (gargiOpen) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [history, gargiOpen]);

  // Admin: proactive store-state recommendation on open
  useEffect(() => {
    if (!gargiOpen || !isAdmin) return;
    const fetchData = async () => {
      try {
        const [storeRes, salesRes] = await Promise.all([
          fetch(`${MOCK_API_BASE}/store_state`),
          fetch(`${MOCK_API_BASE}/sales_dashboard`),
        ]);
        const storeState = await storeRes.json();
        const salesDashboard = await salesRes.json();
        let recommendation: ChatMessage | null = null;

        if (storeState.stockout_risk === 'CRITICAL' || storeState.stockoutRisk === 'CRITICAL') {
          const product = storeState.product || 'Biker Leather Jacket';
          recommendation = {
            role: 'ai',
            text: `Critical: ${product} is depleted. Estimated lost revenue: PKR 12,000/day.`,
            isRestockRecommendation: true,
            restockCategory: storeState.product_category || 'Leather Jackets',
          };
        } else if (!storeState.saleActive && (storeState.revenueChange ?? 0) <= -14) {
          recommendation = {
            role: 'ai',
            text: `Revenue is down ${Math.abs(storeState.revenueChange ?? 14.2)}% this week. A flash sale on Winter Collection could recover lost ground.`,
            isFlashSaleRecommendation: true,
            showApprovalButtons: true,
            approvalStatus: 'pending',
            agentData: {
              recommended_discount: salesDashboard.suggested_discount || 15,
              recommended_duration: salesDashboard.suggested_duration || 6,
            },
          };
        } else if (storeState.saleActive) {
          recommendation = {
            role: 'ai',
            text: `Flash sale is live at ${storeState.saleDiscount}% off. Monitoring conversion uplift.`,
            isPerformanceReport: true,
            performanceSummary: `Sale active since launch. Use the AI Lab to check agent trace logs.`,
          };
        }

        if (recommendation) {
          setHistory(prev => {
            const already = prev.some(m => m.role === 'ai' && m.text === recommendation!.text);
            if (already) return prev;
            return [...prev, recommendation!];
          });
        }
      } catch {}
    };
    fetchData();
  }, [gargiOpen]);

  // Customer: no proactive fetch — Gargi is purely conversational

  const executeSend = async (userMessage: string) => {
    if (!userMessage.trim()) return;
    setHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    const cacheKey = `${isAdmin ? 'admin' : 'customer'}:${userMessage.trim().toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setHistory(prev => [...prev, { role: 'ai', text: cached }]);
      setIsTyping(false);
      return;
    }

    try {
      let agentData = null;
      const lowerMsg = userMessage.toLowerCase();
      const needsAgent = isAdmin && (lowerMsg.includes('sale') || lowerMsg.includes('inventory') || lowerMsg.includes('stock') || lowerMsg.includes('revenue') || lowerMsg.includes('agent') || lowerMsg.includes('run') || lowerMsg.includes('analys'));
      if (needsAgent) {
        try {
          const agentRes = await withTimeout(fetch(`${API_BASE}/api/agent/run`, { method: 'POST' }), 10000);
          agentData = await agentRes.json();
        } catch { /* agent unavailable — continue with chat only */ }
      }

      const chatRes = await withTimeout(fetch(`${API_BASE}/api/gargi/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          isAdmin,
          context: { userName: user?.name, currentView: mode, agentAnalysis: agentData },
        }),
      }), 10000);
      const data = await chatRes.json();
      const responseText = data.text || 'I am momentarily unavailable. Please try again.';
      setCache(cacheKey, responseText);
      setHistory(prev => [...prev, {
        role: 'ai',
        text: responseText,
        isAgentResult: !!agentData,
        agentData: agentData ? {
          recommended_discount: agentData.recommended_discount,
          recommended_duration: agentData.recommended_duration,
          risk_level: agentData.risk_level,
          sale_recommended: agentData.sale_recommended,
          low_stock_items: agentData.low_stock_items || [],
        } : undefined,
        showApprovalButtons: agentData?.sale_recommended && isAdmin,
        approvalStatus: agentData?.sale_recommended ? 'pending' : undefined,
      }]);
    } catch (err: any) {
      const isTimeout = err?.message === 'timeout';
      setHistory(prev => [...prev, {
        role: 'ai',
        text: isTimeout
          ? "Response took too long. Here's what I know: check Inventory for stock alerts, or visit AI Lab for a full analysis."
          : "I'm momentarily unavailable. Please try again in a moment.",
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => { const m = message; setMessage(''); executeSend(m); };

  const handleInlineApprove = async (index: number) => {
    const msg = history[index];
    if (!msg.agentData) return;
    try {
      const res = await fetch(`${API_BASE}/api/agent/execute-sale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount: msg.agentData.recommended_discount || 15, duration: msg.agentData.recommended_duration || 6 }),
      });
      const data = await res.json();
      if (data.success) {
        useStore.getState().launchSale(msg.agentData.recommended_discount || 15, msg.agentData.recommended_duration || 6);
        setHistory(prev => { const next = [...prev]; next[index] = { ...next[index], approvalStatus: 'approved' }; return next; });
      }
    } catch {}
  };

  const handleInlineDecline = (index: number) => {
    setHistory(prev => { const next = [...prev]; next[index] = { ...next[index], approvalStatus: 'declined' }; return next; });
  };

  const handleLaunchCampaign = (index: number, tip: string) => {
    addCampaign({
      id: `AI-${Date.now().toString(36).toUpperCase()}`,
      name: tip.slice(0, 40),
      status: 'Active',
      reach: '1,200 users',
      ctr: '0%',
      type: 'Email',
      icon: 'Email',
      color: '#3fb950',
    });
    setHistory(prev => { const next = [...prev]; next[index] = { ...next[index], isMarketingRecommendation: false, isPerformanceReport: true, performanceSummary: 'Campaign launched and added to Marketing tab.' }; return next; });
  };

  const handleOrderNow = (category: string) => {
    orderRestock(category);
    setHistory(prev => [...prev, { role: 'ai', text: `Restock order placed for ${category}. You'll see it reflected in the Inventory tab.` }]);
  };

  const toggleListening = () => {
    setIsListening(prev => {
      if (!prev) {
        const sample = isAdmin ? 'Show me current stock levels.' : 'Show me some elegant evening wear.';
        setTimeout(() => { setIsListening(false); setMessage(sample); }, 2500);
      }
      return !prev;
    });
  };

  if (!gargiOpen) {
    return (
      <View style={styles.fabWrap}>
        <TouchableOpacity style={styles.fab} onPress={() => setGargiOpen(true)} activeOpacity={0.85}>
          <Sparkles size={18} color={`${COLORS.primary}99`} strokeWidth={1.5} />
          {hasBadge && isAdmin && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{lowStockCount > 0 ? String(lowStockCount) : '!'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableOpacity style={styles.overlay} onPress={() => setGargiOpen(false)} activeOpacity={1} />
      <Animated.View style={[styles.chatPanel, { transform: [{ translateY: slideAnim }] }]}>
        {/* Header */}
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderLeft}>
            <View style={styles.chatHeaderIcon}>
              <Sparkles size={22} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.chatHeaderTitle}>{isAdmin ? 'Retail Intelligence' : 'Fashion Concierge'}</Text>
              <Text style={styles.chatHeaderSub}>{isAdmin ? 'Powered by Antigravity' : 'Gargi · Personalized Style'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setGargiOpen(false)} style={styles.chatCloseBtn} activeOpacity={0.7}>
            <X size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {history.map((msg, i) => (
            <View key={i} style={[styles.msgRow, msg.role === 'user' && styles.msgRowUser]}>
              <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
                <Text style={[styles.bubbleText, msg.role === 'user' && styles.bubbleTextUser]}>{msg.text}</Text>

                {/* ADMIN: Restock recommendation */}
                {msg.isRestockRecommendation && isAdmin && (
                  <View style={styles.actionBlock}>
                    <View style={styles.actionBlockHeader}>
                      <Package size={12} color={COLORS.danger} />
                      <Text style={styles.actionBlockLabel}>Emergency Replenishment</Text>
                    </View>
                    <Text style={styles.actionBlockDesc}>Initiate restock for {msg.restockCategory}.</Text>
                    <View style={styles.actionBtnRow}>
                      <TouchableOpacity style={styles.primaryActionBtn} onPress={() => msg.restockCategory && handleOrderNow(msg.restockCategory)} activeOpacity={0.8}>
                        <Package size={11} color="#000" />
                        <Text style={styles.primaryActionText}>Order Now</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => navigation?.navigate?.('AIIntelligence')} activeOpacity={0.7}>
                        <BrainCircuit size={11} color={COLORS.primary} />
                        <Text style={styles.secondaryActionText}>AI Lab</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* ADMIN: Flash sale recommendation */}
                {msg.showApprovalButtons && msg.approvalStatus === 'pending' && isAdmin && (
                  <View style={[styles.actionBlock, { borderColor: `${COLORS.purple}33`, backgroundColor: `${COLORS.purple}0a` }]}>
                    <View style={styles.actionBlockHeader}>
                      <Zap size={12} color={COLORS.purple} />
                      <Text style={[styles.actionBlockLabel, { color: COLORS.purple }]}>AI Recommendation</Text>
                    </View>
                    <Text style={styles.actionBlockDesc}>
                      {msg.agentData?.recommended_discount}% flash sale for {msg.agentData?.recommended_duration}h on Winter Collection.
                    </Text>
                    <View style={styles.actionBtnRow}>
                      <TouchableOpacity style={styles.primaryActionBtn} onPress={() => handleInlineApprove(i)} activeOpacity={0.8}>
                        <Zap size={11} color="#000" />
                        <Text style={styles.primaryActionText}>Launch Sale</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => handleInlineDecline(i)} activeOpacity={0.7}>
                        <Text style={styles.secondaryActionText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {msg.showApprovalButtons && msg.approvalStatus === 'approved' && (
                  <View style={[styles.actionBlock, { borderColor: `${COLORS.primary}33`, backgroundColor: `${COLORS.primary}0a` }]}>
                    <Text style={[styles.actionBlockLabel, { color: COLORS.primary }]}>✓ Flash Sale Launched</Text>
                  </View>
                )}

                {msg.showApprovalButtons && msg.approvalStatus === 'declined' && (
                  <View style={[styles.actionBlock, { borderColor: 'rgba(255,255,255,0.06)' }]}>
                    <Text style={[styles.actionBlockDesc, { fontStyle: 'italic' }]}>✗ Recommendation Declined.</Text>
                  </View>
                )}

                {/* ADMIN: Marketing recommendation with Launch Campaign button */}
                {msg.isMarketingRecommendation && isAdmin && (
                  <View style={[styles.actionBlock, { borderColor: `${COLORS.primary}33`, backgroundColor: `${COLORS.primary}0a` }]}>
                    <View style={styles.actionBlockHeader}>
                      <Zap size={12} color={COLORS.primary} />
                      <Text style={[styles.actionBlockLabel, { color: COLORS.primary }]}>Marketing Campaign Tip</Text>
                    </View>
                    <Text style={styles.actionBlockDesc}>{msg.marketingTip}</Text>
                    <TouchableOpacity style={[styles.primaryActionBtn, { marginTop: 4 }]} onPress={() => handleLaunchCampaign(i, msg.marketingTip || 'AI Campaign')} activeOpacity={0.8}>
                      <Zap size={11} color="#000" />
                      <Text style={styles.primaryActionText}>Launch Campaign</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ADMIN: Performance report with AI Lab shortcut */}
                {msg.isPerformanceReport && isAdmin && (
                  <View style={[styles.actionBlock, { borderColor: `${COLORS.success}33`, backgroundColor: `${COLORS.success}0a` }]}>
                    <View style={styles.actionBlockHeader}>
                      <BrainCircuit size={12} color={COLORS.success} />
                      <Text style={[styles.actionBlockLabel, { color: COLORS.success }]}>Performance Insight</Text>
                    </View>
                    <Text style={styles.actionBlockDesc}>{msg.performanceSummary}</Text>
                    <TouchableOpacity style={[styles.secondaryActionBtn, { marginTop: 4 }]} onPress={() => navigation?.navigate?.('AIIntelligence')} activeOpacity={0.7}>
                      <BrainCircuit size={11} color={COLORS.primary} />
                      <Text style={styles.secondaryActionText}>Open AI Lab</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ADMIN: Agent analysis result with action buttons */}
                {msg.isAgentResult && isAdmin && msg.agentData && (
                  <View style={styles.agentMetaBlock}>
                    <View style={styles.agentMetaHeader}>
                      <BrainCircuit size={12} color={COLORS.primary} />
                      <Text style={styles.agentMetaTitle}>Agent Snapshot</Text>
                    </View>
                    <Text style={styles.agentMetaLine}>Risk: {msg.agentData.risk_level}</Text>
                    {msg.agentData.low_stock_items?.length > 0 && (
                      <Text style={styles.agentMetaLine}>
                        Low stock: {msg.agentData.low_stock_items.map((it: any) => it.name).join(', ')}
                      </Text>
                    )}
                    {msg.agentData.sale_recommended && msg.approvalStatus === 'pending' && (
                      <View style={[styles.actionBtnRow, { marginTop: 8 }]}>
                        <TouchableOpacity style={styles.primaryActionBtn} onPress={() => handleInlineApprove(i)} activeOpacity={0.8}>
                          <Zap size={11} color="#000" />
                          <Text style={styles.primaryActionText}>Launch {msg.agentData.recommended_discount}% Sale</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => navigation?.navigate?.('AIIntelligence')} activeOpacity={0.7}>
                          <Text style={styles.secondaryActionText}>Full Analysis</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {msg.agentData.low_stock_items?.slice(0, 2).map((item: any, idx: number) => (
                      <TouchableOpacity key={idx} style={[styles.primaryActionBtn, { marginTop: 6, backgroundColor: `${COLORS.warning}22`, borderWidth: 1, borderColor: `${COLORS.warning}44` }]} onPress={() => handleOrderNow(item.name)} activeOpacity={0.8}>
                        <Package size={11} color={COLORS.warning} />
                        <Text style={[styles.primaryActionText, { color: COLORS.warning }]}>Order {item.name} ({item.stock} left)</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* CUSTOMER: Shopping helper actions */}
                {!isAdmin && msg.role === 'ai' && msg.text.toLowerCase().includes('jacket') && (
                  <TouchableOpacity style={[styles.actionBlock, { borderColor: `${COLORS.primary}22`, backgroundColor: `${COLORS.primary}0a`, flexDirection: 'row', alignItems: 'center', gap: 8 }]} onPress={() => navigation?.navigate?.('Shop')} activeOpacity={0.8}>
                    <ShoppingBag size={12} color={COLORS.primary} />
                    <Text style={[styles.actionBlockLabel, { color: COLORS.primary, textTransform: 'none', letterSpacing: 0 }]}>Browse Jackets</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          {isTyping && (
            <View style={styles.msgRow}>
              <View style={[styles.bubble, styles.bubbleAI, { paddingHorizontal: 4, paddingVertical: 4 }]}><SkeletonLoader /></View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputArea}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsRow}>
              {(isAdmin ? ADMIN_QUICK_ACTIONS : CUSTOMER_QUICK_ACTIONS).map(action => (
                <TouchableOpacity key={action} style={styles.quickAction} onPress={() => executeSend(action)} activeOpacity={0.7}>
                  <Sparkles size={10} color={COLORS.primary} />
                  <Text style={styles.quickActionText}>{action}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {isListening && (
              <View style={styles.listeningRow}>
                {[1,2,3,4,5,6,7,8].map(i => (
                  <View key={i} style={[styles.voiceBar, { height: Math.random() * 16 + 4 }]} />
                ))}
                <Text style={styles.listeningText}>Capturing Voice...</Text>
              </View>
            )}
            <View style={styles.inputRow}>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={message}
                  onChangeText={setMessage}
                  placeholder={isAdmin ? 'Ask about stock, revenue, campaigns...' : 'Ask about style, sizing, collections...'}
                  placeholderTextColor={`${COLORS.muted}55`}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                />
                <TouchableOpacity onPress={toggleListening} style={styles.micBtn} activeOpacity={0.7}>
                  {isListening ? <MicOff size={18} color={COLORS.primary} /> : <Mic size={18} color={COLORS.muted} />}
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!message.trim()}
                activeOpacity={0.85}
              >
                <Send size={18} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fabWrap: { position: 'absolute', bottom: 140, right: 20, zIndex: 100 },
  fab: { width: 48, height: 48, backgroundColor: `${COLORS.card}aa`, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, backgroundColor: COLORS.danger, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.bg, paddingHorizontal: 3 },
  badgeText: { fontFamily: FONTS.mono, fontSize: 9, color: '#fff', fontWeight: '700' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 140 },
  chatPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '78%', backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS['3xl'], borderTopRightRadius: RADIUS['3xl'], zIndex: 150, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  chatHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  chatHeaderIcon: { width: 44, height: 44, backgroundColor: `${COLORS.primary}18`, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${COLORS.primary}22` },
  chatHeaderTitle: { fontFamily: FONTS.serifItalic, fontSize: 18, color: COLORS.text },
  chatHeaderSub: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2 },
  chatCloseBtn: { padding: 10, borderRadius: RADIUS.full },
  messages: { flex: 1, backgroundColor: `${COLORS.bg}33` },
  msgRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  msgRowUser: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '85%', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 14 },
  bubbleUser: { backgroundColor: COLORS.primary },
  bubbleAI: { backgroundColor: `${COLORS.bg}cc`, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  bubbleText: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.text, lineHeight: 20 },
  bubbleTextUser: { color: '#000', fontFamily: FONTS.sansBold },
  actionBlock: { marginTop: 10, padding: 12, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: `${COLORS.danger}33`, backgroundColor: `${COLORS.danger}0a`, gap: 6 },
  actionBlockHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBlockLabel: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.danger, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  actionBlockDesc: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.text, lineHeight: 17 },
  actionBtnRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  primaryActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 9 },
  primaryActionText: { fontFamily: FONTS.mono, fontSize: 9, color: '#000', textTransform: 'uppercase', fontWeight: '700' },
  secondaryActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: `${COLORS.primary}12`, borderRadius: RADIUS.md, paddingVertical: 9, borderWidth: 1, borderColor: `${COLORS.primary}22` },
  secondaryActionText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.primary, textTransform: 'uppercase' },
  agentMetaBlock: { marginTop: 10, padding: 10, borderRadius: RADIUS.md, backgroundColor: 'rgba(0,0,0,0.3)', gap: 4 },
  agentMetaHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  agentMetaTitle: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.primary, textTransform: 'uppercase', fontWeight: '700' },
  agentMetaLine: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted },
  inputArea: { padding: 16, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', gap: 10 },
  quickActionsRow: { flexDirection: 'row', gap: 8 },
  quickAction: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  quickActionText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.text, textTransform: 'uppercase', letterSpacing: 1 },
  listeningRow: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center', paddingVertical: 8 },
  voiceBar: { width: 3, backgroundColor: COLORS.primary, borderRadius: 2 },
  listeningText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 3, marginLeft: 8 },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 16, paddingVertical: 4 },
  input: { flex: 1, fontFamily: FONTS.sans, fontSize: 13, color: COLORS.text, paddingVertical: 10 },
  micBtn: { padding: 6 },
  sendBtn: { width: 48, height: 48, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  sendBtnDisabled: { opacity: 0.4 },
});
