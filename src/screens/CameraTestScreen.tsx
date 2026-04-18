import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Platform,
  Alert,
  PermissionsAndroid,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { RootStackParamList } from '../navigation/types';
import GlassButton from '../components/GlassButton';
import ScreenHeader from '../components/ScreenHeader';
import { GRADIENTS, TEXT, STATUS, GLASS } from '../theme/colors';
import { useDiagnostic } from '../store/DiagnosticContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CameraTest'>;
type StepId = 'rear' | 'front' | 'torch' | 'video';
type CheckStatus = 'pending' | 'pass' | 'fail';
type Phase = 'idle' | 'rear' | 'front' | 'torch' | 'video' | 'done';

const PHASE_ORDER: Phase[] = ['idle', 'rear', 'front', 'torch', 'video', 'done'];

const STEPS: { id: StepId; title: string; icon: string; color: string; instruction: string }[] = [
  { id: 'rear',  title: 'Rear Camera',     icon: 'camera-outline',         color: '#4facfe', instruction: 'Can you see a clear live view from the back camera above?' },
  { id: 'front', title: 'Front Camera',    icon: 'camera-reverse-outline', color: '#a78bfa', instruction: 'Can you see the front (selfie) camera live view?' },
  { id: 'torch', title: 'Flash / Torch',   icon: 'flash-outline',          color: '#ffd200', instruction: 'Did the rear flash blink on and off automatically?' },
  { id: 'video', title: 'Video Recording', icon: 'videocam-outline',       color: '#38ef7d', instruction: 'Is video recording live and smooth in the preview?' },
];

export default function CameraTestScreen() {
  const navigation = useNavigation<Nav>();
  const { setResult } = useDiagnostic();
  const cameraRef = useRef<Camera>(null);

  const backDevice  = useCameraDevice('back');
  const frontDevice = useCameraDevice('front');

  const [phase,     setPhase]     = useState<Phase>('idle');
  const [statuses,  setStatuses]  = useState<Record<StepId, CheckStatus>>({
    rear: 'pending', front: 'pending', torch: 'pending', video: 'pending',
  });
  const [torchOn,   setTorchOn]   = useState(false);
  const [torchDone, setTorchDone] = useState(false);
  const [permitted, setPermitted] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // ─── Permissions ──────────────────────────────────────────────────────────
  useEffect(() => { askPermissions(); }, []);

  const askPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const r = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        const granted =
          r[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
          r[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
        setPermitted(granted);
        if (!granted) {
          Alert.alert('Permission Needed', 'Camera & Microphone permissions are required for this test.', [
            { text: 'Retry', onPress: askPermissions },
          ]);
        }
      } catch (_) {
        setPermitted(false);
      }
    } else {
      setPermitted(true);
    }
  };

  // ─── Auto torch blink when phase is 'torch' ───────────────────────────────
  useEffect(() => {
    if (phase !== 'torch') { setTorchOn(false); setTorchDone(false); return; }
    let alive = true;
    setTorchDone(false);
    (async () => {
      // 4 clear blinks so user can definitively see flash
      for (let i = 0; i < 4; i++) {
        if (!alive) break;
        setTorchOn(true);  await sleep(900);
        if (!alive) break;
        setTorchOn(false); await sleep(600);
      }
      if (alive) setTorchDone(true); // unlock Yes/No only after blinks finish
    })();
    return () => { alive = false; setTorchOn(false); };
  }, [phase]);

  // ─── Countdown during video phase ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'video') { setCountdown(0); return; }
    setCountdown(5);
    const id = setInterval(() => setCountdown(c => (c > 1 ? c - 1 : (clearInterval(id), 0))), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

  // ─── Actions ──────────────────────────────────────────────────────────────
  const startTest = () => setPhase('rear');

  const confirm = (answer: 'pass' | 'fail') => {
    const stepId = phase as StepId;
    setStatuses(prev => ({ ...prev, [stepId]: answer }));
    const idx  = PHASE_ORDER.indexOf(phase);
    const next = PHASE_ORDER[idx + 1] as Phase;
    setPhase(next);
  };

  const handleFinish = () => {
    const vals   = Object.values(statuses);
    const passed = vals.filter(s => s === 'pass').length;
    setResult('camera', {
      status:  passed === 4 ? 'pass' : passed >= 2 ? 'warning' : 'fail',
      score:   Math.round((passed / 4) * 100),
      details: `${passed}/4 camera modules verified`,
    });
    navigation.navigate('ConnectivityTest');
  };

  // ─── Derived ──────────────────────────────────────────────────────────────
  const currentStep  = STEPS.find(s => s.id === phase) ?? null;
  const previewDevice =
    phase === 'front' ? frontDevice 
    : backDevice; 

  const showCamera = permitted && !!previewDevice;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Camera Diagnostic"
          subtitle="Verify each camera module"
          step={6}
          onBack={() => navigation.goBack()}
          iconName="camera-outline"
        />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── LIVE CAMERA PREVIEW BOX ── */}
          <View style={styles.previewBox}>
            {showCamera ? (
              <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={previewDevice!}
                isActive={phase !== 'done'}
                photo={phase !== 'idle' && phase !== 'done'}
                video={phase === 'video'}
                audio={phase === 'video'}
                torch={torchOn ? 'on' : 'off'}
              />
            ) : (
              <View style={styles.noCamView}>
                {!permitted ? (
                  <>
                    <Icon name="lock-closed-outline" size={52} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.noCamText}>Camera permission required</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={askPermissions}>
                      <Text style={styles.retryText}>Grant Permission</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Icon name="videocam-off-outline" size={52} color="rgba(255,255,255,0.25)" />
                    <Text style={styles.noCamText}>Camera module not found</Text>
                  </>
                )}
              </View>
            )}

            {/* Live badge + torch indicator */}
            {showCamera && phase !== 'done' && (
              <View style={styles.overlayTop}>
                <View style={[styles.badge, { backgroundColor: phase === 'idle' ? 'rgba(56,239,125,0.85)' : 'rgba(220,50,50,0.85)' }]}>
                  <View style={styles.dot} />
                  <Text style={styles.badgeText}>
                    {phase === 'idle' ? 'LIVE' : (currentStep?.title ?? '').toUpperCase()}
                  </Text>
                </View>
                {phase === 'video' && countdown > 0 && (
                  <View style={styles.timerPill}>
                    <Text style={styles.timerText}>{countdown}s</Text>
                  </View>
                )}
                {/* Torch phase: show FLASH ON / OFF live indicator */}
                {phase === 'torch' && !torchDone && (
                  <View style={[styles.torchIndicator, { backgroundColor: torchOn ? 'rgba(255,220,0,0.92)' : 'rgba(0,0,0,0.7)' }]}>
                    <Icon name={torchOn ? 'flash' : 'flash-outline'} size={18} color={torchOn ? '#000' : '#ffd200'} />
                    <Text style={[styles.torchIndicatorText, { color: torchOn ? '#000' : '#ffd200' }]}>
                      {torchOn ? 'FLASH ON' : 'FLASH OFF'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Done overlay */}
            {phase === 'done' && (
              <View style={styles.doneOverlay}>
                <Icon name="checkmark-done-circle" size={80} color="#38ef7d" />
                <Text style={styles.doneText}>All Tests Complete</Text>
                <Text style={styles.doneSubText}>Tap Finish & Continue below</Text>
              </View>
            )}
          </View>

          {/* ── INSTRUCTION + YES / NO ── */}
          {phase !== 'idle' && phase !== 'done' && currentStep && (
            <View style={styles.instrCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.instrRow}>
                <View style={[styles.instrIcon, { borderColor: currentStep.color + '55' }]}>
                  <Icon name={currentStep.icon} size={26} color={currentStep.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.instrTitle}>{currentStep.title}</Text>
                  <Text style={styles.instrDesc}>{currentStep.instruction}</Text>
                </View>
              </View>
              {/* Torch: wait for blinks to finish before showing Yes/No */}
              {phase === 'torch' && !torchDone ? (
                <View style={styles.waitingRow}>
                  <Icon name="flash" size={20} color="#ffd200" />
                  <Text style={styles.waitingText}>Flash blinking... please watch your device</Text>
                </View>
              ) : (
                <View style={styles.yesNoRow}>
                  <TouchableOpacity style={[styles.yesNoBtn, styles.yesBtn]} onPress={() => confirm('pass')} activeOpacity={0.8}>
                    <Icon name="checkmark-circle" size={22} color="#38ef7d" />
                    <Text style={styles.yesBtnText}>Yes — Working</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.yesNoBtn, styles.noBtn]} onPress={() => confirm('fail')} activeOpacity={0.8}>
                    <Icon name="close-circle" size={22} color="#ef473a" />
                    <Text style={styles.noBtnText}>No — Failed</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* ── STEP CHECKLIST ── */}
          <View style={styles.checklist}>
            {STEPS.map(s => {
              const st         = statuses[s.id];
              const isActive   = phase === s.id;
              const dotColor   = st === 'pass' ? STATUS.pass : st === 'fail' ? STATUS.fail : isActive ? s.color : STATUS.pending;
              const dotIcon    = st === 'pass' ? 'checkmark' : st === 'fail' ? 'close' : null;

              return (
                <View key={s.id} style={[styles.checkItem, isActive && styles.checkItemActive]}>
                  <View style={[styles.checkIcon, { borderColor: s.color + '44' }]}>
                    <Icon name={s.icon} size={18} color={isActive ? s.color : st !== 'pending' ? s.color : 'rgba(255,255,255,0.4)'} />
                  </View>
                  <Text style={[styles.checkLabel, isActive && styles.checkLabelActive]}>{s.title}</Text>
                  <View style={[styles.statusDot, { backgroundColor: dotColor }]}>
                    {dotIcon && <Icon name={dotIcon} size={11} color="#fff" />}
                    {!dotIcon && isActive && <View style={styles.pulseDot} />}
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── ACTION BUTTON ── */}
          {phase === 'idle' && (
            <GlassButton
              title="Start Camera Test"
              onPress={startTest}
              iconName="play-circle-outline"
              size="lg"
              variant="primary"
              style={styles.mainBtn}
            />
          )}
          {phase === 'done' && (
            <GlassButton
              title="Finish & Continue"
              onPress={handleFinish}
              iconName="arrow-forward"
              size="lg"
              variant="success"
              style={styles.mainBtn}
            />
          )}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg:   { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32, gap: 14 },

  /* ── Preview Box ── */
  previewBox: {
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: GLASS.borderStrong,
  },
  noCamView: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  noCamText: { color: 'rgba(255,255,255,0.35)', fontSize: 15, fontWeight: '600' },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(102,126,234,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.6)',
  },
  retryText: { color: '#a78bfa', fontWeight: '700', fontSize: 14 },
  overlayTop: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  timerPill: { backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  timerText: { color: '#ffd200', fontSize: 15, fontWeight: '800' },
  doneOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  doneText:    { color: '#38ef7d', fontSize: 22, fontWeight: '800' },
  doneSubText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },

  torchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,220,0,0.5)',
  },
  torchIndicatorText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  waitingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10 },
  waitingText: { color: '#ffd200', fontSize: 13, fontWeight: '600' },

  /* ── Instruction Card ── */
  instrCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    padding: 16,
    gap: 14,
  },
  instrRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  instrIcon: {
    width: 48, height: 48, borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  instrTitle: { color: TEXT.primary, fontSize: 15, fontWeight: '800', marginBottom: 3 },
  instrDesc:  { color: TEXT.secondary, fontSize: 13, lineHeight: 19 },
  yesNoRow: { flexDirection: 'row', gap: 10 },
  yesNoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 14, gap: 8 },
  yesBtn: { backgroundColor: 'rgba(56,239,125,0.12)', borderWidth: 1.5, borderColor: 'rgba(56,239,125,0.5)' },
  noBtn:  { backgroundColor: 'rgba(239,71,58,0.12)',  borderWidth: 1.5, borderColor: 'rgba(239,71,58,0.5)' },
  yesBtnText: { color: '#38ef7d', fontWeight: '700', fontSize: 14 },
  noBtnText:  { color: '#ef473a', fontWeight: '700', fontSize: 14 },

  /* ── Checklist ── */
  checklist: { gap: 8 },
  checkItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  checkItemActive: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  checkIcon: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  checkLabel: { flex: 1, color: TEXT.secondary, fontSize: 14, fontWeight: '600' },
  checkLabelActive: { color: TEXT.primary },
  statusDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

  mainBtn: { marginTop: 4 },
});
