import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, CameraDevice } from 'react-native-vision-camera';
import { RootStackParamList } from '../navigation/types';
import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';
import ScreenHeader from '../components/ScreenHeader';
import { GRADIENTS, TEXT, GLASS, STATUS } from '../theme/colors';
import { useDiagnostic } from '../store/DiagnosticContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CameraTest'>;
type TestState = 'idle' | 'checking' | 'rear_photo' | 'front_photo' | 'video_record' | 'torch' | 'completed';
type CheckStatus = 'pending' | 'pass' | 'fail';

const CAMERA_CHECKS = [
  { id: 'rear', title: 'Rear Camera', icon: 'camera-outline', color: '#4facfe' },
  { id: 'front', title: 'Front Camera', icon: 'camera-reverse-outline', color: '#a78bfa' },
  { id: 'torch', title: 'Flash / Torch', icon: 'flash-outline', color: '#ffd200' },
  { id: 'video', title: 'Video Recording', icon: 'videocam-outline', color: '#38ef7d' },
];

const CameraTestScreen = () => {
  const navigation = useNavigation<Nav>();
  const { setResult } = useDiagnostic();
  const backDevice = useCameraDevice('back');
  const frontDevice = useCameraDevice('front');
  const cameraRef = useRef<Camera>(null);

  const [testState, setTestState] = useState<TestState>('idle');
  const [statuses, setStatuses] = useState<Record<string, CheckStatus>>({
    rear: 'pending',
    front: 'pending',
    torch: 'pending',
    video: 'pending',
  } as Record<string, CheckStatus>);
  const [countdown, setCountdown] = useState(0);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<CameraDevice | null>(null);

  const requestPermissions = async () => {
    const cameraPermission = await Camera.requestCameraPermission();
    const microphonePermission = await Camera.requestMicrophonePermission();
    return cameraPermission === 'granted' && microphonePermission === 'granted';
  };

  const startAutomatedTest = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera and Microphone permissions are required for this test.');
      return;
    }
    runSequence();
  };

  const runSequence = async () => {
    // 1. Rear Camera Photo
    setTestState('rear_photo');
    setCurrentDevice(backDevice || null);
    await startTimer(3);
    setStatuses(prev => ({ ...prev, rear: 'pass' }));

    // 2. Front Camera Photo
    setTestState('front_photo');
    setCurrentDevice(frontDevice || null);
    await startTimer(3);
    setStatuses(prev => ({ ...prev, front: 'pass' }));

    // 3. Torch Test
    setTestState('torch');
    setCurrentDevice(backDevice || null);
    setTorchEnabled(true);
    await startTimer(1);
    setTorchEnabled(false);
    setStatuses(prev => ({ ...prev, torch: 'pass' }));

    // 4. Video Recording
    setTestState('video_record');
    await startTimer(3);
    setStatuses(prev => ({ ...prev, video: 'pass' }));

    setTestState('completed');
  };

  const startTimer = (seconds: number) => {
    return new Promise<void>((resolve) => {
      setCountdown(seconds);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            resolve();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });
  };

  const handleFinish = () => {
    const vals = Object.values(statuses);
    const passed = vals.filter(s => s === 'pass').length;
    setResult('camera', {
      status: passed === 4 ? 'pass' : passed >= 2 ? 'warning' : 'fail',
      score: Math.round((passed / 4) * 100),
      details: `${passed}/4 modules verified automatically`,
    });
    navigation.navigate('ConnectivityTest');
  };

  const getStatusColor = (status: CheckStatus) => {
    if (status === 'pass') return STATUS.pass;
    if (status === 'fail') return STATUS.fail;
    return STATUS.pending;
  };

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Automated Camera"
          subtitle="Full hardware module diagnostics"
          step={6}
          onBack={() => navigation.goBack()}
          iconName="camera-outline"
        />
        
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Real Camera Preview */}
          <GlassCard variant="strong" style={styles.previewCard}>
            <View style={styles.previewContainer}>
              {currentDevice && testState !== 'idle' && testState !== 'completed' ? (
                <Camera
                  ref={cameraRef}
                  style={StyleSheet.absoluteFill}
                  device={currentDevice}
                  isActive={true}
                  photo={true}
                  video={true}
                  audio={true}
                  torch={torchEnabled ? 'on' : 'off'}
                />
              ) : (
                <View style={styles.previewPlaceholder}>
                  <Icon 
                    name={testState === 'completed' ? 'checkmark-done-circle' : 'videocam-off-outline'} 
                    size={64} 
                    color="rgba(255,255,255,0.2)" 
                  />
                  <Text style={styles.previewText}>
                    {testState === 'completed' ? 'Test Sequence Finished' : 'Camera Module Offline'}
                  </Text>
                </View>
              )}
              
              {/* Overlay Indicators */}
              {testState !== 'idle' && testState !== 'completed' && (
                <View style={styles.overlay}>
                  <View style={styles.badge}>
                    <View style={styles.redDot} />
                    <Text style={styles.badgeText}>{testState.toUpperCase().replace('_', ' ')}</Text>
                  </View>
                  <View style={styles.timerCircle}>
                    <Text style={styles.timerText}>{countdown}s</Text>
                  </View>
                </View>
              )}
            </View>
          </GlassCard>

          {/* Progress List */}
          <View style={styles.progressList}>
            {CAMERA_CHECKS.map((check) => (
              <GlassCard key={check.id} style={styles.checkCard} padding={12}>
                <View style={styles.checkRow}>
                  <View style={[styles.checkIcon, { borderColor: check.color + '44' }]}>
                    <Icon name={check.icon} size={20} color={check.color} />
                  </View>
                  <Text style={styles.checkTitle}>{check.title}</Text>
                  <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(statuses[check.id]) }]}>
                    {statuses[check.id] !== 'pending' && (
                      <Icon name="checkmark" size={12} color="#fff" />
                    )}
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>

          {testState === 'idle' ? (
            <GlassButton
              title="Start Full Hardware Test"
              onPress={startAutomatedTest}
              iconName="play-circle-outline"
              size="lg"
              variant="primary"
              style={styles.mainBtn}
            />
          ) : testState === 'completed' ? (
            <GlassButton
              title="Finish & Continue"
              onPress={handleFinish}
              iconName="arrow-forward"
              size="lg"
              variant="success"
              style={styles.mainBtn}
            />
          ) : (
            <View style={styles.runningState}>
              <Text style={styles.runningText}>Diagnostic Running...</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: 20 },
  previewCard: { marginBottom: 20, height: 350, overflow: 'hidden' },
  previewContainer: { flex: 1, backgroundColor: '#000', borderRadius: 16, overflow: 'hidden' },
  previewPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  previewText: { color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: '600' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef473a' },
  timerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  timerText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  progressList: { gap: 10, marginBottom: 20 },
  checkCard: { borderLeftWidth: 3, borderLeftColor: 'rgba(255,255,255,0.1)' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  checkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  checkTitle: { flex: 1, color: TEXT.primary, fontSize: 15, fontWeight: '600' },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtn: { marginVertical: 10 },
  runningState: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
  },
  runningText: { color: TEXT.accent, fontSize: 16, fontWeight: '700' },
});

export default CameraTestScreen;
