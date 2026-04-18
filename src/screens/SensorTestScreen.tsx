import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  accelerometer,
  gyroscope,
  magnetometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import type { Subscription } from 'rxjs';
import { RootStackParamList } from '../navigation/types';
import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';
import ScreenHeader from '../components/ScreenHeader';
import StatusBadge from '../components/StatusBadge';
import { GRADIENTS, TEXT, GLASS, STATUS } from '../theme/colors';
import { useDiagnostic } from '../store/DiagnosticContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SensorTest'>;
type TestPhase = 'accel' | 'gyro' | 'magnet' | 'done';

interface SensorReading {
  x: number;
  y: number;
  z: number;
}

const PHASE_CONFIG = {
  accel: {
    title: 'Accelerometer',
    instruction: 'Shake or tilt your phone rapidly',
    icon: 'phone-portrait-outline',
    color: '#4facfe',
    threshold: 2.5,
  },
  gyro: {
    title: 'Gyroscope',
    instruction: 'Rotate your phone in all directions',
    icon: 'sync-circle-outline',
    color: '#a78bfa',
    threshold: 1.5,
  },
  magnet: {
    title: 'Magnetometer',
    instruction: 'Move your phone in a figure-8 pattern',
    icon: 'compass-outline',
    color: '#38ef7d',
    threshold: 8.0,
  },
};

export default function SensorTestScreen() {
  const navigation = useNavigation<Nav>();
  const { setResult } = useDiagnostic();
  
  const [phase, setPhase] = useState<TestPhase>('accel');
  const [active, setActive] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [results, setResults] = useState<Record<string, 'pass' | 'fail' | 'pending'>>({
    accel: 'pending',
    gyro: 'pending',
    magnet: 'pending',
  });

  const [liveData, setLiveData] = useState<SensorReading>({ x: 0, y: 0, z: 0 });
  const [lastDelta, setLastDelta] = useState(0);
  const lastData = useRef<SensorReading | null>(null);
  const subs = useRef<Subscription | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ─── Phase Management ─────────────────────────────────────────────────────
  
  useEffect(() => {
    if (!active || phase === 'done') return;

    setCountdown(5);
    setDetectionProgress(0);
    progressAnim.setValue(0);
    startSensorStream(phase);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishPhase('fail');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      stopSensorStream();
    };
  }, [phase, active]);

  const startSensorStream = (p: TestPhase) => {
    stopSensorStream();
    const interval = 100;
    
    if (p === 'accel') {
      setUpdateIntervalForType(SensorTypes.accelerometer, interval);
      subs.current = accelerometer.subscribe({
        next: data => processData(data, PHASE_CONFIG.accel.threshold),
        error: () => finishPhase('fail'),
      });
    } else if (p === 'gyro') {
      setUpdateIntervalForType(SensorTypes.gyroscope, interval);
      subs.current = gyroscope.subscribe({
        next: data => processData(data, PHASE_CONFIG.gyro.threshold),
        error: () => finishPhase('fail'),
      });
    } else if (p === 'magnet') {
      setUpdateIntervalForType(SensorTypes.magnetometer, interval);
      subs.current = magnetometer.subscribe({
        next: data => processData(data, PHASE_CONFIG.magnet.threshold),
        error: () => finishPhase('fail'),
      });
    }
  };

  const stopSensorStream = () => {
    subs.current?.unsubscribe();
    subs.current = null;
    lastData.current = null;
  };

  const processData = (data: SensorReading, threshold: number) => {
    setLiveData(data);
    
    if (lastData.current) {
      const dx = Math.abs(data.x - lastData.current.x);
      const dy = Math.abs(data.y - lastData.current.y);
      const dz = Math.abs(data.z - lastData.current.z);
      const delta = Math.max(dx, dy, dz);
      setLastDelta(delta);

      if (delta > threshold) {
        setDetectionProgress(prev => {
          const next = Math.min(prev + 0.25, 1);
          Animated.timing(progressAnim, {
            toValue: next,
            duration: 200,
            useNativeDriver: false,
          }).start();
          
          if (next >= 1) {
            finishPhase('pass');
          }
          return next;
        });
      }
    }
    lastData.current = data;
  };

  const finishPhase = (res: 'pass' | 'fail') => {
    setResults(prev => ({ ...prev, [phase]: res }));
    
    if (phase === 'accel') setPhase('gyro');
    else if (phase === 'gyro') setPhase('magnet');
    else if (phase === 'magnet') {
      setPhase('done');
      setActive(false);
    }
  };

  useEffect(() => {
    if (phase === 'done') {
      saveFinalResult();
    }
  }, [phase]);

  const saveFinalResult = () => {
    const vals = Object.values(results);
    const passed = vals.filter(v => v === 'pass').length;
    setResult('sensors', {
      status: passed === 3 ? 'pass' : passed >= 1 ? 'warning' : 'fail',
      score: Math.round((passed / 3) * 100),
      details: `${passed}/3 sensors verified by live motion`,
    });
  };

  const handleStart = () => {
    setPhase('accel');
    setActive(true);
    setResults({ accel: 'pending', gyro: 'pending', magnet: 'pending' });
  };

  // ─── Rendering ────────────────────────────────────────────────────────────

  const currentCfg = phase !== 'done' ? PHASE_CONFIG[phase] : null;

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Sensor Diagnostic"
          subtitle="Live motion & orientation verification"
          step={8}
          onBack={() => navigation.goBack()}
          iconName="compass-outline"
        />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* Main Visualizer Card */}
          <GlassCard variant="strong" style={styles.visualCard}>
            <View style={styles.visualHeader}>
              <View style={[styles.badgePill, { backgroundColor: active ? 'rgba(56,239,125,0.2)' : 'rgba(255,255,255,0.1)' }]}>
                <View style={[styles.dot, { backgroundColor: active ? STATUS.pass : TEXT.muted }]} />
                <Text style={[styles.badgeText, { color: active ? STATUS.pass : TEXT.muted }]}>
                  {active ? 'TESTING' : 'IDLE'}
                </Text>
              </View>
              {active && (
                <View style={styles.timerPill}>
                  <Text style={styles.timerText}>{countdown}s remaining</Text>
                </View>
              )}
            </View>

            {phase !== 'done' ? (
              <View style={styles.testInfo}>
                <View style={[styles.iconBox, { borderColor: currentCfg?.color + '55' }]}>
                  <Icon name={currentCfg?.icon || 'help'} size={40} color={currentCfg?.color} />
                </View>
                <Text style={styles.phaseTitle}>{currentCfg?.title}</Text>
                <Text style={styles.instruction}>{currentCfg?.instruction}</Text>

                {active && (
                  <View style={styles.progressContainer}>
                    <View style={styles.deltaInfo}>
                      <Text style={styles.progressLabel}>Detection Confidence</Text>
                      <Text style={[styles.deltaText, { color: currentCfg?.color }]}>
                        {lastDelta.toFixed(1)} / {currentCfg?.threshold}
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <Animated.View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', '100%']
                            }),
                            backgroundColor: currentCfg?.color
                          }
                        ]} 
                      />
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.doneView}>
                <Icon name="checkmark-done-circle" size={80} color={STATUS.pass} />
                <Text style={styles.doneTitle}>Diagnostic Complete</Text>
                <Text style={styles.doneDesc}>All key sensors have been verified</Text>
              </View>
            )}
          </GlassCard>

          {/* Checklist Card */}
          <GlassCard style={styles.checklistCard}>
            <Text style={styles.sectionTitle}>Verification Checklist</Text>
            {Object.entries(PHASE_CONFIG).map(([id, cfg]) => {
              const res = results[id as keyof typeof results];
              const isCurrent = phase === id;
              return (
                <View key={id} style={[styles.checkItem, isCurrent && styles.checkItemActive]}>
                  <View style={[styles.checkIcon, { borderColor: cfg.color + '44' }]}>
                    <Icon name={cfg.icon} size={18} color={isCurrent ? cfg.color : TEXT.muted} />
                  </View>
                  <Text style={[styles.checkLabel, isCurrent && styles.checkLabelActive]}>
                    {cfg.title}
                  </Text>
                  <StatusBadge 
                    status={res === 'pending' ? 'pending' : res} 
                    label={res === 'pending' ? (isCurrent ? 'Running' : 'Wait') : res === 'pass' ? 'Success' : 'Failed'}
                    size="sm"
                  />
                </View>
              );
            })}
          </GlassCard>

          {/* Action Buttons */}
          {!active && phase !== 'done' && (
            <GlassButton
              title="Start Sensor Test"
              onPress={handleStart}
              iconName="play-circle-outline"
              size="lg"
              variant="primary"
            />
          )}

          {phase === 'done' && (
            <GlassButton
              title="Continue to Battery Test"
              onPress={() => navigation.navigate('BatteryTest')}
              iconName="arrow-forward"
              size="lg"
              variant="success"
            />
          )}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },

  visualCard: {
    minHeight: 320,
    justifyContent: 'center',
    padding: 24,
  },
  visualHeader: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  timerPill: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: { color: TEXT.secondary, fontSize: 12, fontWeight: '700' },

  testInfo: { alignItems: 'center', gap: 16, marginTop: 20 },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  phaseTitle: { color: TEXT.primary, fontSize: 24, fontWeight: '800' },
  instruction: { color: TEXT.secondary, fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },

  progressContainer: { width: '100%', marginTop: 20, gap: 10 },
  deltaInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  progressLabel: { color: TEXT.muted, fontSize: 12, fontWeight: '700' },
  deltaText: { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  progressTrack: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressFill: { height: '100%', borderRadius: 5 },

  doneView: { alignItems: 'center', gap: 12 },
  doneTitle: { color: STATUS.pass, fontSize: 24, fontWeight: '800' },
  doneDesc: { color: TEXT.secondary, fontSize: 15 },

  checklistCard: { gap: 12 },
  sectionTitle: { color: TEXT.primary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
  },
  checkItemActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  checkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  checkLabel: { flex: 1, color: TEXT.secondary, fontSize: 15, fontWeight: '600' },
  checkLabelActive: { color: TEXT.primary },
});
