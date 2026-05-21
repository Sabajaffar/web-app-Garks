import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Animated, Easing, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Database, FileText, LineChart as LineChartIcon, MessageCircle, Activity,
  AlertTriangle, BrainCircuit, Play, CheckCircle2, AlertCircle,
  ArrowRight, CheckSquare, MessageSquare, Upload, X, Link, Trash2
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useStore } from '../../store/useStore';
import { COLORS, FONTS, RADIUS } from '../../theme';
import { API_BASE, MOCK_API_BASE } from '../../config';

const DOC_TYPES = [
  { id: 'pdf', label: 'PDF', ext: '.pdf', mime: 'application/pdf', color: '#f87171', desc: 'Reports, Catalogs' },
  { id: 'excel', label: 'Excel', ext: '.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', color: COLORS.success, desc: 'Sales, Stock Data' },
  { id: 'word', label: 'Word', ext: '.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', color: '#60a5fa', desc: 'Contracts, Emails' },
  { id: 'csv', label: 'CSV', ext: '.csv', mime: 'text/csv', color: COLORS.secondary, desc: 'Warehouse Data' },
  { id: 'url', label: 'URL', ext: '', mime: '', color: '#a78bfa', desc: 'Web / News Feed' },
];

const STEPS = [
  { label: 'Reading warehouse (STRUCTURED)...', icon: Database },
  { label: 'Reading supplier_email (SEMI-STRUCTURED)...', icon: FileText },
  { label: 'Reading sales_dashboard (STRUCTURED)...', icon: LineChartIcon },
  { label: 'Reading customer_reviews (UNSTRUCTURED)...', icon: MessageCircle },
  { label: 'Reading news_feed (SEMI-STRUCTURED)...', icon: Activity },
  { label: 'Identifying Contradictions', icon: AlertTriangle },
  { label: 'Synthesizing Final Conclusion', icon: BrainCircuit },
];

const SOURCE_CONFIG = [
  { id: 'warehouse', label: 'warehouse', type: 'STRUCTURED', stale: true },
  { id: 'supplier_email', label: 'supplier_email', type: 'SEMI-STRUCTURED', stale: false },
  { id: 'sales_dashboard', label: 'sales_dashboard', type: 'STRUCTURED', stale: false },
  { id: 'customer_reviews', label: 'customer_reviews', type: 'UNSTRUCTURED', stale: false },
  { id: 'news_feed', label: 'news_feed', type: 'SEMI-STRUCTURED', stale: false },
];

const SOURCE_COLORS: Record<string, string> = {
  STRUCTURED: COLORS.success,
  'SEMI-STRUCTURED': '#2dd4bf',
  UNSTRUCTURED: COLORS.purple,
};

export default function AIIntelligence({ navigation }: any) {
  const { setGargiOpen, inventory, kpiRevenue, kpiOrders, kpiCustomers, orderRestock, cancelRestock, orderedCategories, addCampaign } = useStore();
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState<'idle' | 'processing' | 'ready' | 'executed'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentData, setAgentData] = useState<any>(null);
  const [insightsDismissed, setInsightsDismissed] = useState(false);
  const [pendingAgentData, setPendingAgentData] = useState<any>(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [sourcesLoaded, setSourcesLoaded] = useState<Record<string, boolean>>({});

  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState(20);
  const [durationHours, setDurationHours] = useState(4);

  // Document upload state
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { name: string; uri: string; mime: string } | null>>({
    pdf: null, excel: null, word: null, csv: null, url: null,
  });
  const [urlInput, setUrlInput] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadInsights, setUploadInsights] = useState<any | null>(null);
  const [campaignType, setCampaignType] = useState('Send promotional push notification to customers');
  const [targetAudience, setTargetAudience] = useState('Wishlist Customers');
  const [estimatedReach, setEstimatedReach] = useState('1,200 users');

  const dataFetchedRef = useRef(dataFetched);
  const pendingAgentDataRef = useRef(pendingAgentData);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { dataFetchedRef.current = dataFetched; }, [dataFetched]);
  useEffect(() => { pendingAgentDataRef.current = pendingAgentData; }, [pendingAgentData]);

  useEffect(() => {
    SOURCE_CONFIG.forEach(async src => {
      try {
        await fetch(`${MOCK_API_BASE}/${src.id}`);
        setSourcesLoaded(prev => ({ ...prev, [src.id]: true }));
      } catch {
        setSourcesLoaded(prev => ({ ...prev, [src.id]: true }));
      }
    });
  }, []);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    if (targetAudience === 'Wishlist Customers') setEstimatedReach('1,200 users');
    else if (targetAudience === 'All Customers') setEstimatedReach('10,900 users');
    else if (targetAudience === 'Inactive Shoppers') setEstimatedReach('3,450 users');
    else if (targetAudience === 'Repeat Buyers') setEstimatedReach('2,100 users');
  }, [targetAudience]);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agent/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    setStatus('processing');
    setCurrentStep(0);
    setDataFetched(false);
    setPendingAgentData(null);
    setInsightsDismissed(false);
    setError(null);
    setLogs([]);

    // Poll orchestrator instead of SSE
    const pollOrchestrator = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/orchestrator/run`);
        if (!res.ok) throw new Error('Orchestrator error');
        const data = await res.json();
        if (data.type === 'awaiting_approval') {
          setAnalyzedAt(data.analyzed_at || data.timestamp || new Date().toISOString());
          const formatted = {
            workplan: `ShopAgent autonomous decision: ${data.reasoning}`,
            sources_analyzed: data.sources_analyzed || ['warehouse', 'supplier_email', 'sales_dashboard', 'customer_reviews', 'news_feed'],
            recommended_discount: data.recommended_discount,
            recommended_duration: data.recommended_duration,
            insights: data.analysis_result?.insights || [],
            actionName: data.action?.name,
            sale_recommended: data.sale_recommended === true,
            action_chain: data.action_chain || [],
            contradictions: data.analysis_result?.contradictions?.map((c: any) => `${c.metric}: ${c.resolution}`) || [],
            summary: data.analysis_result?.summary || '',
            key_metrics: data.analysis_result?.key_metrics || {},
          };
          setPendingAgentData(formatted);
          setDataFetched(true);
        }
      } catch (err: any) {
        setError(err.message || 'Connection failed.');
        setStatus('idle');
      }
    };
    pollOrchestrator();
  };

  useEffect(() => {
    if (status === 'processing') {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < STEPS.length - 1) return prev + 1;
          if (dataFetchedRef.current && pendingAgentDataRef.current) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setAgentData(pendingAgentDataRef.current);
            setDiscountPercent(pendingAgentDataRef.current.recommended_discount || 20);
            setDurationHours(pendingAgentDataRef.current.recommended_duration || 4);
            setStatus('ready');
          }
          return prev;
        });
      }, 700);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [status]);

  const handleExecuteSale = async () => {
    try {
      setShowConfirmation(false);
      const res = await fetch(`${API_BASE}/api/orchestrator/approve-sale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount: discountPercent, duration: durationHours }),
      });
      if (!res.ok) throw new Error('Deploy failed');
      setStatus('executed');
    } catch (err: any) {
      setError(err.message || 'Execution failed');
    }
  };

  const handleExecuteMarketing = async () => {
    try {
      setShowConfirmation(false);
      const res = await fetch(`${API_BASE}/api/orchestrator/approve-marketing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignType, targetAudience, estimatedReach }),
      });
      if (!res.ok) throw new Error('Deploy failed');
      // Add to Marketing tab — addCampaign has de-dup logic in the store
      addCampaign({
        id: `AI-${Date.now().toString(36).toUpperCase()}`,
        name: campaignType,
        status: 'Active',
        reach: estimatedReach,
        ctr: '0%',
        type: 'Email',
        icon: 'Email',
        color: '#3fb950',
      });
      setStatus('executed');
    } catch (err: any) {
      setError(err.message || 'Execution failed');
    }
  };

  const handleEndSale = async () => {
    try {
      await fetch(`${API_BASE}/api/agent/end-sale`, { method: 'POST' });
      setStatus('idle');
      setAgentData(null);
      fetchLogs();
    } catch {}
  };

  const pickDocument = async (typeId: string) => {
    if (typeId === 'url') return; // URL handled by text input
    const typeInfo = DOC_TYPES.find(t => t.id === typeId);
    if (!typeInfo) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [typeInfo.mime, '*/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setUploadedDocs(prev => ({ ...prev, [typeId]: { name: asset.name, uri: asset.uri, mime: asset.mimeType || typeInfo.mime } }));
      }
    } catch (e) {
      Alert.alert('Picker Error', 'Could not open file picker.');
    }
  };

  const removeDoc = (typeId: string) => {
    setUploadedDocs(prev => ({ ...prev, [typeId]: null }));
    if (typeId === 'url') setUrlInput('');
  };

  const uploadAndAnalyze = async () => {
    const hasFiles = Object.values(uploadedDocs).some(d => d !== null) || urlInput.trim();
    if (!hasFiles) {
      Alert.alert('No Documents', 'Please upload at least one document or enter a URL to analyze.');
      return;
    }
    setUploadingId('analyzing');
    setUploadInsights(null);
    try {
      // Upload each file sequentially
      let lastResult: any = null;
      for (const [id, doc] of Object.entries(uploadedDocs)) {
        if (!doc) continue;
        const formData = new FormData();
        formData.append('file', { uri: doc.uri, type: doc.mime, name: doc.name } as any);
        const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
        if (res.ok) lastResult = await res.json();
      }
      // If URL, send as text file
      if (urlInput.trim()) {
        const blob = new Blob([urlInput.trim()], { type: 'text/plain' });
        const formData = new FormData();
        formData.append('file', blob, 'url_input.txt');
        const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
        if (res.ok) lastResult = await res.json();
      }
      if (lastResult) setUploadInsights(lastResult);
      else Alert.alert('Upload Failed', 'Could not process documents. Make sure the backend is running.');
    } catch (e: any) {
      Alert.alert('Upload Error', e?.message || 'Network error. Check backend connection.');
    } finally {
      setUploadingId(null);
    }
  };

  const lowStockItems = inventory.filter(p => p.stock < 5);

  const stepAngle = (i: number) => ((i / STEPS.length) * Math.PI * 2) - Math.PI / 2;
  const ORBIT_R = 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Central Intelligence</Text>
          <Text style={styles.subtitle}>Autonomous Store Optimization</Text>
          {analyzedAt && (
            <Text style={styles.analyzedAt}>
              Last analyzed {new Date(analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>

        {/* Critical Low Stock Badge */}
        {lowStockItems.length > 0 && (
          <View style={styles.criticalCard}>
            <View style={styles.criticalHeader}>
              <AlertCircle size={24} color={COLORS.danger} />
              <Text style={styles.criticalTitle}>CRITICAL LOW-STOCK RECOMMENDATION</Text>
            </View>
            <Text style={styles.criticalDesc}>
              Our real-time retail auditor has flagged the following items as critically low (less than 5 units). Immediate restocking is highly recommended:
            </Text>
            {lowStockItems.map(item => {
              const isOrdered = orderedCategories.includes(item.category);
              return (
                <View key={item.id} style={styles.stockRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stockName}>{item.name}</Text>
                    <Text style={styles.stockCat}>{item.category}</Text>
                  </View>
                  <View style={styles.stockLeft}>
                    <Text style={styles.stockLeftText}>{item.stock} LEFT</Text>
                  </View>
                  {isOrdered ? (
                    <View style={styles.orderedBadge}><Text style={styles.orderedText}>Ordered</Text></View>
                  ) : (
                    <View style={styles.stockActions}>
                      <TouchableOpacity style={styles.orderBtn} onPress={() => orderRestock(item.category)} activeOpacity={0.8}>
                        <Text style={styles.orderBtnText}>Order</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelRestock(item.category)} activeOpacity={0.7}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* IDLE STATE */}
        {status === 'idle' && (
          <View style={styles.idleWrap}>
            {error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>ERROR: {error}</Text>
              </View>
            )}

            {/* Upload Documents Section */}
            <View style={styles.uploadSection}>
              <View style={styles.uploadSectionHeader}>
                <Upload size={16} color={COLORS.secondary} />
                <Text style={styles.uploadSectionTitle}>Upload Your Documents</Text>
              </View>
              <Text style={styles.uploadSectionSub}>Upload up to 5 document types for AI analysis</Text>

              <View style={styles.docGrid}>
                {DOC_TYPES.map(dt => {
                  const uploaded = uploadedDocs[dt.id];
                  const isUrl = dt.id === 'url';
                  return (
                    <View key={dt.id} style={[styles.docSlot, { borderColor: uploaded || (isUrl && urlInput) ? `${dt.color}50` : 'rgba(255,255,255,0.08)' }]}>
                      <View style={[styles.docSlotIcon, { backgroundColor: `${dt.color}18` }]}>
                        {dt.id === 'pdf' && <FileText size={18} color={dt.color} />}
                        {dt.id === 'excel' && <LineChartIcon size={18} color={dt.color} />}
                        {dt.id === 'word' && <MessageSquare size={18} color={dt.color} />}
                        {dt.id === 'csv' && <Database size={18} color={dt.color} />}
                        {dt.id === 'url' && <Link size={18} color={dt.color} />}
                      </View>
                      <Text style={[styles.docSlotLabel, { color: dt.color }]}>{dt.label}</Text>
                      <Text style={styles.docSlotDesc}>{dt.desc}</Text>

                      {isUrl ? (
                        <TextInput
                          style={styles.urlInput}
                          value={urlInput}
                          onChangeText={setUrlInput}
                          placeholder="https://..."
                          placeholderTextColor={`${COLORS.muted}55`}
                          autoCapitalize="none"
                          keyboardType="url"
                        />
                      ) : uploaded ? (
                        <View style={styles.uploadedRow}>
                          <Text style={styles.uploadedName} numberOfLines={1}>{uploaded.name}</Text>
                          <TouchableOpacity onPress={() => removeDoc(dt.id)} style={styles.removeBtn} activeOpacity={0.7}>
                            <X size={10} color={COLORS.danger} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity style={styles.pickBtn} onPress={() => pickDocument(dt.id)} activeOpacity={0.8}>
                          <Upload size={10} color={COLORS.muted} />
                          <Text style={styles.pickBtnText}>Choose</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.analyzeBtn, uploadingId === 'analyzing' && { opacity: 0.6 }]}
                onPress={uploadAndAnalyze}
                disabled={uploadingId === 'analyzing'}
                activeOpacity={0.85}
              >
                <BrainCircuit size={16} color="#000" />
                <Text style={styles.analyzeBtnText}>{uploadingId === 'analyzing' ? 'Analyzing...' : 'Analyze My Documents'}</Text>
              </TouchableOpacity>
            </View>

            {/* Upload Insights Result */}
            {uploadInsights && (
              <View style={styles.uploadInsightsCard}>
                <View style={styles.uploadInsightsHeader}>
                  <CheckCircle2 size={16} color={COLORS.success} />
                  <Text style={styles.uploadInsightsTitle}>Document Analysis Complete</Text>
                  <TouchableOpacity onPress={() => setUploadInsights(null)} style={{ marginLeft: 'auto' as any }}>
                    <X size={14} color={COLORS.muted} />
                  </TouchableOpacity>
                </View>
                {uploadInsights.summary && <Text style={styles.uploadInsightsSummary}>{uploadInsights.summary}</Text>}
                {uploadInsights.problems?.slice(0, 3).map((p: string, i: number) => (
                  <View key={i} style={styles.insightProblemRow}>
                    <AlertTriangle size={10} color={COLORS.warning} />
                    <Text style={styles.insightProblemText}>{p}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR USE LIVE AGENT DATA</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Data Sources */}
            {SOURCE_CONFIG.map(src => {
              const loaded = sourcesLoaded[src.id];
              const typeColor = SOURCE_COLORS[src.type] || COLORS.muted;
              return (
                <View key={src.id} style={styles.sourceCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sourceName}>{src.label}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: `${typeColor}18` }]}>
                      <Text style={[styles.typeText, { color: typeColor }]}>{src.type}</Text>
                    </View>
                    <Text style={[styles.sourceStatus, { color: src.stale ? COLORS.warning : COLORS.success }]}>
                      {!loaded ? 'Fetching...' : src.stale ? '⚠ STALE (3 days old)' : '✓ FRESH (today)'}
                    </Text>
                  </View>
                  <CheckCircle2 size={16} color={loaded ? COLORS.success : COLORS.muted} />
                </View>
              );
            })}

            <TouchableOpacity style={styles.runBtn} onPress={handleStart} activeOpacity={0.85}>
              <Play size={20} color="#000" />
              <Text style={styles.runBtnText}>Run Agent Workflow</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PROCESSING STATE */}
        {status === 'processing' && (
          <View style={styles.processingWrap}>
            <View style={styles.orbitContainer}>
              <Animated.View style={[styles.orbitBrain, { transform: [{ scale: pulseAnim }] }]}>
                <BrainCircuit size={60} color={COLORS.primary} />
              </Animated.View>
              {STEPS.map((step, i) => {
                const angle = stepAngle(i);
                const x = Math.cos(angle) * ORBIT_R;
                const y = Math.sin(angle) * ORBIT_R;
                const isActive = i === currentStep;
                const isPast = i < currentStep;
                const Icon = step.icon;
                return (
                  <View
                    key={i}
                    style={[styles.orbitNode, {
                      transform: [{ translateX: x }, { translateY: y }],
                      backgroundColor: isActive ? COLORS.success : isPast ? `${COLORS.success}33` : '#172925',
                      borderColor: isActive ? COLORS.success : isPast ? COLORS.success : '#2a3f38',
                    }]}
                  >
                    <Icon size={14} color={isActive ? '#000' : isPast ? COLORS.primary : COLORS.muted} />
                  </View>
                );
              })}
            </View>
            <Text style={styles.processingLabel}>{STEPS[currentStep].label}</Text>
            <View style={styles.stepDots}>
              {STEPS.map((_, i) => (
                <View key={i} style={[styles.stepDot, { width: i === currentStep ? 24 : 8, backgroundColor: i <= currentStep ? COLORS.primary : 'rgba(255,255,255,0.08)' }]} />
              ))}
            </View>
            <Text style={styles.processingHint}>ShopAgent Reasoning Active...</Text>
          </View>
        )}

        {/* READY STATE */}
        {status === 'ready' && agentData && (
          <View style={styles.readyWrap}>
            {/* Workplan Banner */}
            <View style={styles.workplanCard}>
              <View style={styles.workplanHeader}>
                <BrainCircuit size={24} color={COLORS.primary} />
                <Text style={styles.workplanTitle}>ShopAgent Autonomous Workplan</Text>
              </View>
              <Text style={styles.workplanText}>{agentData.workplan}</Text>
            </View>

            {/* Store Data Summary */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Store Data Summary</Text>
              <View style={styles.kpiGrid}>
                {[
                  { label: 'Revenue', value: `$${kpiRevenue.toLocaleString()}` },
                  { label: 'Orders', value: kpiOrders.toLocaleString() },
                  { label: 'Total Stock', value: inventory.reduce((a, p) => a + p.stock, 0).toString() },
                  { label: 'Customers', value: kpiCustomers.toLocaleString() },
                ].map(kpi => (
                  <View key={kpi.label} style={styles.kpiCell}>
                    <Text style={styles.kpiCellLabel}>{kpi.label}</Text>
                    <Text style={styles.kpiCellValue}>{kpi.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Sources Analyzed */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Data Streams Analyzed</Text>
              <View style={styles.sourceBadgeRow}>
                {agentData.sources_analyzed.map((src: string, i: number) => {
                  const nameLower = src.toLowerCase();
                  let type = 'UNSTRUCTURED';
                  let color = COLORS.purple;
                  if (nameLower.includes('warehouse') || nameLower.includes('dashboard')) { type = 'STRUCTURED'; color = COLORS.success; }
                  else if (nameLower.includes('email') || nameLower.includes('feed')) { type = 'SEMI-STRUCTURED'; color = '#2dd4bf'; }
                  return (
                    <View key={i} style={[styles.srcBadge, { borderColor: `${color}33`, backgroundColor: `${color}12` }]}>
                      <Text style={[styles.srcBadgeName, { color }]}>{src}</Text>
                      <Text style={[styles.srcBadgeType, { color: `${color}88` }]}>{type}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Contradictions */}
            {agentData.contradictions?.length > 0 && (
              <View style={styles.contradictionCard}>
                <View style={styles.contradictionHeader}>
                  <AlertCircle size={20} color={COLORS.danger} />
                  <Text style={styles.contradictionTitle}>Contradiction Warning</Text>
                </View>
                {agentData.contradictions.map((c: string, i: number) => (
                  <Text key={i} style={styles.contradictionItem}>• {c}</Text>
                ))}
              </View>
            )}

            {/* Insights */}
            {!insightsDismissed && agentData.insights?.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.insightsHeader}>
                  <Text style={styles.sectionLabel}>Key Operational Insights</Text>
                  <TouchableOpacity onPress={() => setInsightsDismissed(true)} style={styles.dismissBtn} activeOpacity={0.7}>
                    <Text style={styles.dismissBtnText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
                {agentData.insights.map((insight: string, i: number) => (
                  <View key={i} style={styles.insightRow}>
                    <View style={styles.insightNum}><Text style={styles.insightNumText}>{i + 1}</Text></View>
                    <Text style={styles.insightText}>{insight}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Action Chain */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Recommended Action Chain</Text>
              {agentData.action_chain.map((action: any, i: number) => (
                <View key={action.id || i} style={styles.actionCard}>
                  <View style={styles.actionHeader}>
                    <Text style={styles.actionName}>Step {action.id}: {action.name}</Text>
                    <View style={styles.actionStatus}>
                      <Text style={styles.actionStatusText}>{action.status || 'pending'}</Text>
                    </View>
                  </View>
                  <Text style={styles.actionReasoning}>{action.reasoning}</Text>
                  <View style={styles.constraintRow}>
                    <CheckSquare size={10} color={COLORS.primary} />
                    <Text style={styles.constraintText}>Constraint Check: {action.constraint_check}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* CTA Buttons */}
            <View style={styles.ctaRow}>
              <TouchableOpacity style={styles.discussBtn} onPress={() => setGargiOpen(true)} activeOpacity={0.8}>
                <MessageSquare size={18} color={COLORS.secondary} />
                <Text style={styles.discussBtnText}>Discuss</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setShowConfirmation(true)} activeOpacity={0.85}>
                <Text style={styles.applyBtnText}>Apply Strategy</Text>
                <ArrowRight size={18} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* EXECUTED STATE */}
        {status === 'executed' && (
          <View style={styles.executedWrap}>
            <View style={styles.executedIcon}>
              <CheckCircle2 size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.executedTitle}>Elegance Executed</Text>
            <Text style={styles.executedSub}>"GarKS inventory adaptive state is deployed globally."</Text>
            <View style={styles.executedActions}>
              <TouchableOpacity style={styles.terminateBtn} onPress={handleEndSale} activeOpacity={0.8}>
                <Text style={styles.terminateBtnText}>Terminate Sale</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dashBtn} onPress={() => { setStatus('idle'); setAgentData(null); }} activeOpacity={0.8}>
                <Text style={styles.dashBtnText}>Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Agent Trace Terminal */}
        <View style={styles.terminal}>
          <View style={styles.terminalHeader}>
            <View style={styles.terminalDots}>
              <View style={[styles.termDot, { backgroundColor: '#ef4444cc' }]} />
              <View style={[styles.termDot, { backgroundColor: '#fbbf24cc' }]} />
              <View style={[styles.termDot, { backgroundColor: `${COLORS.primary}cc` }]} />
            </View>
            <Text style={styles.terminalTitle}>Agent Trace Ledger</Text>
            <Text style={styles.terminalLive}>LIVE SYNCED</Text>
          </View>
          {logs.length === 0 ? (
            <Text style={styles.terminalEmpty}>Awaiting agent activity...</Text>
          ) : (
            [...logs].reverse().slice(0, 8).map((log: any, i: number) => {
              const isWarn = log.action?.toLowerCase().includes('fail') || log.result?.toLowerCase().includes('delay');
              const isOk = log.action?.toLowerCase().includes('sale') || log.action?.toLowerCase().includes('complete');
              const color = isWarn ? COLORS.danger : isOk ? COLORS.success : `${COLORS.primary}b3`;
              return (
                <Text key={i} style={styles.logLine} numberOfLines={1}>
                  <Text style={styles.logTime}>[{new Date(log.timestamp).toLocaleTimeString()}] </Text>
                  <Text style={styles.logAction}>{log.action}: </Text>
                  <Text style={{ color }}>{log.result}</Text>
                </Text>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmation} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconWrap}>
              <CheckSquare size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.confirmTitle}>
              {agentData?.sale_recommended ? 'Authorize Retail Strategy' : 'Agent recommends Marketing Campaign'}
            </Text>
            <View style={styles.recommendBox}>
              <Text style={styles.recommendLabel}>Agent Recommendation</Text>
              <Text style={styles.recommendText}>
                {agentData?.sale_recommended
                  ? `"Execute a ${agentData.recommended_discount}% flash sale for ${agentData.recommended_duration} hours to optimize inventory."`
                  : '"Active sale detected. Initiating multi-channel marketing campaign for low-stock items."'}
              </Text>
            </View>

            {agentData?.sale_recommended ? (
              <View style={styles.preferenceSection}>
                <Text style={styles.prefLabel}>Sale Discount (%)</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => setDiscountPercent(v => Math.max(5, v - 5))} activeOpacity={0.7}>
                    <Text style={styles.stepperBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{discountPercent}%</Text>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => setDiscountPercent(v => Math.min(75, v + 5))} activeOpacity={0.7}>
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.prefLabel}>Duration (hours)</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => setDurationHours(v => Math.max(1, v - 1))} activeOpacity={0.7}>
                    <Text style={styles.stepperBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{durationHours}h</Text>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => setDurationHours(v => Math.min(24, v + 1))} activeOpacity={0.7}>
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.preferenceSection}>
                <Text style={styles.prefLabel}>Target Audience</Text>
                {['Wishlist Customers', 'All Customers', 'Inactive Shoppers', 'Repeat Buyers'].map(aud => (
                  <TouchableOpacity
                    key={aud}
                    style={[styles.audienceBtn, targetAudience === aud && styles.audienceBtnActive]}
                    onPress={() => setTargetAudience(aud)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.audienceBtnText, targetAudience === aud && { color: COLORS.primary }]}>{aud}</Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.reachDisplay}>
                  <Text style={styles.reachDisplayText}>{estimatedReach}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.approveBtn}
              onPress={agentData?.sale_recommended ? handleExecuteSale : handleExecuteMarketing}
              activeOpacity={0.85}
            >
              <Text style={styles.approveBtnText}>Approve & Launch Strategy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => setShowConfirmation(false)} activeOpacity={0.7}>
              <Text style={styles.rejectBtnText}>Reject Strategy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
  title: { fontFamily: FONTS.serif, fontSize: 30, color: COLORS.text },
  subtitle: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 },
  analyzedAt: { fontFamily: FONTS.mono, fontSize: 9, color: `${COLORS.primary}99`, marginTop: 6 },
  criticalCard: { marginHorizontal: 20, marginBottom: 16, backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 20, borderWidth: 1, borderColor: `${COLORS.danger}44`, gap: 10 },
  criticalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  criticalTitle: { fontFamily: FONTS.serif, fontSize: 15, color: COLORS.text, flex: 1 },
  criticalDesc: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.muted, lineHeight: 18 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  stockName: { fontFamily: FONTS.serifItalic, fontSize: 12, color: COLORS.text },
  stockCat: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase' },
  stockLeft: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: `${COLORS.danger}22`, borderRadius: RADIUS.full },
  stockLeftText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.danger, fontWeight: '700' },
  stockActions: { flexDirection: 'row', gap: 6 },
  orderBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.primary, borderRadius: RADIUS.md },
  orderBtnText: { fontFamily: FONTS.mono, fontSize: 9, color: '#000', fontWeight: '700', textTransform: 'uppercase' },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.bg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cancelBtnText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase' },
  orderedBadge: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: `${COLORS.primary}18`, borderRadius: RADIUS.full, borderWidth: 1, borderColor: `${COLORS.primary}30` },
  orderedText: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.primary, textTransform: 'uppercase', fontWeight: '700' },
  idleWrap: { paddingHorizontal: 20, gap: 10 },
  errorCard: { backgroundColor: `${COLORS.danger}18`, borderWidth: 1, borderColor: `${COLORS.danger}33`, borderRadius: RADIUS.lg, padding: 14 },
  errorText: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.danger, textAlign: 'center' },
  // Upload section styles
  uploadSection: { backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 20, borderWidth: 1, borderColor: `${COLORS.secondary}22`, gap: 12 },
  uploadSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  uploadSectionTitle: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.text },
  uploadSectionSub: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  docGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  docSlot: { width: '47%', backgroundColor: COLORS.bg, borderRadius: RADIUS.xl, padding: 14, borderWidth: 1, gap: 6 },
  docSlotIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  docSlotLabel: { fontFamily: FONTS.sansBold, fontSize: 12 },
  docSlotDesc: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  urlInput: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 8, fontFamily: FONTS.sans, fontSize: 10, color: COLORS.text, backgroundColor: COLORS.card },
  uploadedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${COLORS.success}15`, borderRadius: RADIUS.md, paddingHorizontal: 8, paddingVertical: 5 },
  uploadedName: { flex: 1, fontFamily: FONTS.mono, fontSize: 8, color: COLORS.success },
  removeBtn: { padding: 2 },
  pickBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md, paddingHorizontal: 8, paddingVertical: 6 },
  pickBtnText: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase' },
  analyzeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.secondary, borderRadius: RADIUS.xl, paddingVertical: 14 },
  analyzeBtnText: { fontFamily: FONTS.mono, fontSize: 10, color: '#000', textTransform: 'uppercase', fontWeight: '700', letterSpacing: 1 },
  uploadInsightsCard: { backgroundColor: `${COLORS.success}0a`, borderRadius: RADIUS.xl, padding: 16, borderWidth: 1, borderColor: `${COLORS.success}25`, gap: 8 },
  uploadInsightsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  uploadInsightsTitle: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.success },
  uploadInsightsSummary: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.text, lineHeight: 18 },
  insightProblemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  insightProblemText: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.muted, flex: 1, lineHeight: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  dividerText: { fontFamily: FONTS.mono, fontSize: 8, color: `${COLORS.muted}77`, textTransform: 'uppercase', letterSpacing: 1 },
  sourceCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  sourceName: { fontFamily: FONTS.serifItalic, fontSize: 13, color: COLORS.text, fontWeight: '700', marginBottom: 4 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.sm, marginBottom: 4 },
  typeText: { fontFamily: FONTS.mono, fontSize: 8, textTransform: 'uppercase', letterSpacing: 1 },
  sourceStatus: { fontFamily: FONTS.mono, fontSize: 9 },
  runBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 18, marginTop: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  runBtnText: { fontFamily: FONTS.mono, fontSize: 12, color: '#000', textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  processingWrap: { alignItems: 'center', paddingVertical: 32, gap: 20 },
  orbitContainer: { width: 260, height: 260, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  orbitBrain: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  orbitNode: { position: 'absolute', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginLeft: -18, marginTop: -18 },
  processingLabel: { fontFamily: FONTS.serif, fontSize: 18, color: COLORS.text, textAlign: 'center', paddingHorizontal: 24 },
  stepDots: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  stepDot: { height: 4, borderRadius: 2 },
  processingHint: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 3 },
  readyWrap: { paddingHorizontal: 20, gap: 16 },
  workplanCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 20, gap: 12, borderWidth: 1, borderColor: `${COLORS.primary}33` },
  workplanHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  workplanTitle: { fontFamily: FONTS.serif, fontSize: 18, color: COLORS.text, flex: 1 },
  workplanText: { fontFamily: FONTS.serifItalic, fontSize: 13, color: COLORS.muted, lineHeight: 20 },
  sectionCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 16, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  sectionLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpiCell: { flex: 1, minWidth: '45%', backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  kpiCellLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', marginBottom: 4 },
  kpiCellValue: { fontFamily: FONTS.mono, fontSize: 18, color: COLORS.primary, fontWeight: '700' },
  sourceBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  srcBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.lg, borderWidth: 1 },
  srcBadgeName: { fontFamily: FONTS.mono, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  srcBadgeType: { fontFamily: FONTS.mono, fontSize: 8 },
  contradictionCard: { backgroundColor: `${COLORS.danger}12`, borderRadius: RADIUS['2xl'], padding: 16, gap: 10, borderWidth: 1, borderColor: `${COLORS.danger}33` },
  contradictionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contradictionTitle: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.danger, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  contradictionItem: { fontFamily: FONTS.serifItalic, fontSize: 12, color: `${COLORS.danger}cc`, lineHeight: 20 },
  insightsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dismissBtn: { backgroundColor: `${COLORS.danger}18`, paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: `${COLORS.danger}33` },
  dismissBtnText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.danger, textTransform: 'uppercase' },
  insightRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  insightNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: `${COLORS.primary}18`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  insightNumText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.primary },
  insightText: { flex: 1, fontFamily: FONTS.serifItalic, fontSize: 12, color: COLORS.text, lineHeight: 20 },
  actionCard: { backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: 14, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  actionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionName: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.primary, fontWeight: '700', textTransform: 'uppercase', flex: 1 },
  actionStatus: { backgroundColor: `${COLORS.warning}18`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, borderWidth: 1, borderColor: `${COLORS.warning}33` },
  actionStatusText: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.warning, textTransform: 'uppercase' },
  actionReasoning: { fontFamily: FONTS.serifItalic, fontSize: 12, color: COLORS.text, lineHeight: 18 },
  constraintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  constraintText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted },
  ctaRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  discussBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: `${COLORS.secondary}18`, borderRadius: RADIUS.xl, paddingVertical: 16, borderWidth: 1, borderColor: `${COLORS.secondary}33` },
  discussBtnText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 2 },
  applyBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  applyBtnText: { fontFamily: FONTS.mono, fontSize: 11, color: '#000', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  executedWrap: { alignItems: 'center', paddingVertical: 48, gap: 16 },
  executedIcon: { width: 96, height: 96, backgroundColor: `${COLORS.primary}22`, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  executedTitle: { fontFamily: FONTS.serifItalic, fontSize: 26, color: COLORS.text },
  executedSub: { fontFamily: FONTS.serifItalic, fontSize: 13, color: COLORS.muted, textAlign: 'center', paddingHorizontal: 32 },
  executedActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  terminateBtn: { flex: 1, backgroundColor: `${COLORS.danger}18`, borderRadius: RADIUS.xl, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: `${COLORS.danger}33` },
  terminateBtnText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.danger, textTransform: 'uppercase', letterSpacing: 1 },
  dashBtn: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: `${COLORS.primary}22` },
  dashBtnText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  terminal: { marginHorizontal: 20, marginTop: 16, backgroundColor: '#090f0d', borderRadius: RADIUS['2xl'], padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  terminalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', marginBottom: 10 },
  terminalDots: { flexDirection: 'row', gap: 5 },
  termDot: { width: 10, height: 10, borderRadius: 5 },
  terminalTitle: { flex: 1, fontFamily: FONTS.mono, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  terminalLive: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  terminalEmpty: { fontFamily: FONTS.mono, fontSize: 10, color: `${COLORS.primary}66`, fontStyle: 'italic' },
  logLine: { fontFamily: FONTS.mono, fontSize: 9, lineHeight: 16 },
  logTime: { color: `${COLORS.muted}88` },
  logAction: { color: COLORS.secondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 },
  confirmCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['3xl'], padding: 28, gap: 16, borderWidth: 1, borderColor: `${COLORS.primary}44`, alignItems: 'center' },
  confirmIconWrap: { width: 64, height: 64, backgroundColor: `${COLORS.primary}18`, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  confirmTitle: { fontFamily: FONTS.serifItalic, fontSize: 20, color: COLORS.text, textAlign: 'center' },
  recommendBox: { width: '100%', backgroundColor: `${COLORS.primary}0a`, borderRadius: RADIUS.xl, padding: 16, borderWidth: 1, borderColor: `${COLORS.primary}22`, gap: 6 },
  recommendLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.primary, textTransform: 'uppercase', fontWeight: '700' },
  recommendText: { fontFamily: FONTS.serifItalic, fontSize: 12, color: COLORS.text, lineHeight: 20 },
  preferenceSection: { width: '100%', gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 16 },
  prefLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16, justifyContent: 'center' },
  stepperBtn: { width: 36, height: 36, backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  stepperBtnText: { fontFamily: FONTS.mono, fontSize: 20, color: COLORS.primary },
  stepperValue: { fontFamily: FONTS.mono, fontSize: 22, color: COLORS.primary, fontWeight: '700', minWidth: 60, textAlign: 'center' },
  audienceBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: COLORS.bg },
  audienceBtnActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}12` },
  audienceBtnText: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.muted },
  reachDisplay: { backgroundColor: `${COLORS.primary}12`, borderRadius: RADIUS.lg, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: `${COLORS.primary}22` },
  reachDisplayText: { fontFamily: FONTS.mono, fontSize: 14, color: COLORS.primary, fontWeight: '700' },
  approveBtn: { width: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 16, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  approveBtnText: { fontFamily: FONTS.mono, fontSize: 10, color: '#000', textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  rejectBtn: { width: '100%', backgroundColor: COLORS.bg, borderRadius: RADIUS.xl, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  rejectBtnText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2 },
});
