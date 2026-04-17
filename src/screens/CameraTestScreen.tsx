import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';
import GlassModal from '../components/GlassModal';
import ScreenHeader from '../components/ScreenHeader';
import { GRADIENTS, TEXT, GLASS, STATUS } from '../theme/colors';
import { useDiagnostic } from '../store/DiagnosticContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CameraTest'>;
type CheckStatus = 'pending' | 'pass' | 'fail';

interface CameraCheck {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  steps: string[];
}

const CAMERA_CHECKS: CameraCheck[] = [
  {
    id: 'rear',
    title: 'Rear Camera',
    description: 'Main camera quality and focus',
    icon: 'camera-outline',
    iconColor: '#4facfe',
    steps: ['Open your camera app', 'Switch to rear camera', 'Check focus, sharpness and colors', 'Try taking a photo'],
  },
  {
    id: 'front',
    title: 'Front Camera',
    description: 'Selfie camera quality',
    icon: 'camera-reverse-outline',
    iconColor: '#a78bfa',
    steps: ['Open your camera app', 'Switch to front camera', 'Check image clarity and colors', 'Test portrait mode if available'],
  },
  {
    id: 'flash',
    title: 'Flash / Torch',
    description: 'LED flash functionality',
    icon: 'flash-outline',
    iconColor: '#ffd200',
    steps: ['Open camera or torch app', 'Turn on the flash/torch', 'Verify it lights up properly'],
  },
  {
    id: 'video',
    title: 'Video Recording',
    description: 'Video capture and stabilization',
    icon: 'videocam-outline',
    iconColor: '#38ef7d',
    steps: ['Open camera and switch to video', 'Record a short clip', 'Check smoothness and audio sync'],
  },
];

const CameraTestScreen = () => {
  const navigation = useNavigation<Nav>();
  const { setResult } = useDiagnostic();
  const [statuses, setStatuses] = useState<Record<string, CheckStatus>>(
    Object.fromEntries(CAMERA_CHECKS.map(c => [c.id, 'pending'])),
  );
  const [stepModal, setStepModal] = useState(false);
  const [currentCheck, setCurrentCheck] = useState<CameraCheck | null>(null);

  const showSteps = (check: CameraCheck) => {
    setCurrentCheck(check);
    setStepModal(true);
  };

  const markStatus = (id: string, status: CheckStatus) => {
    setStatuses(prev => ({ ...prev, [id]: status }));
    setStepModal(false);
  };

  const handleFinish = () => {
    const vals = Object.values(statuses);
    const passed = vals.filter(s => s === 'pass').length;
    const failed = vals.filter(s => s === 'fail').length;
    setResult('camera', {
      status: failed > 1 ? 'fail' : failed === 1 ? 'warning' : 'pass',
      score: Math.round((passed / Math.max(vals.filter(s => s !== 'pending').length, 1)) * 100),
      details: `${passed} passed, ${failed} failed`,
    });
    navigation.navigate('ConnectivityTest');
  };

  const getStatusColor = (status: CheckStatus) => {
    if (status === 'pass') return STATUS.pass;
    if (status === 'fail') return STATUS.fail;
    return STATUS.pending;
  };

  const testedCount = Object.values(statuses).filter(s => s !== 'pending').length;

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Camera Test"
          subtitle="Test all camera modules and their features"
          step={6}
          onBack={() => navigation.goBack()}
          iconName="camera-outline"
        />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Camera preview placeholder */}
          <GlassCard variant="strong" style={styles.previewCard}>
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)']}
              style={styles.preview}
            >
              <View style={styles.previewContent}>
                <Icon name="camera-outline" size={48} color="rgba(255,255,255,0.3)" />
                <Text style={styles.previewText}>Open your Camera App</Text>
                <Text style={styles.previewSub}>Use the native camera app for testing</Text>
              </View>
              {/* Camera UI decorations */}
              <View style={styles.corner} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </LinearGradient>
          </GlassCard>

          {/* Camera checks */}
          {CAMERA_CHECKS.map(check => (
            <GlassCard key={check.id} style={styles.checkCard}>
              <View style={styles.checkRow}>
                <View style={[styles.checkIcon, { borderColor: check.iconColor + '44' }]}>
                  <Icon name={check.icon} size={22} color={check.iconColor} />
                </View>
                <View style={styles.checkInfo}>
                  <Text style={styles.checkTitle}>{check.title}</Text>
                  <Text style={styles.checkDesc}>{check.description}</Text>
                </View>
                <View style={styles.checkRight}>
                  {statuses[check.id] !== 'pending' && (
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(statuses[check.id]) }]} />
                  )}
                  <GlassButton
                    title={statuses[check.id] === 'pending' ? 'Test' : 'Retest'}
                    onPress={() => showSteps(check)}
                    variant="glass"
                    size="sm"
                  />
                </View>
              </View>
            </GlassCard>
          ))}

          <GlassButton
            title={`Continue (${testedCount}/${CAMERA_CHECKS.length} done)`}
            onPress={handleFinish}
            iconName="arrow-forward"
            size="lg"
            style={styles.continueBtn}
          />
        </ScrollView>
      </SafeAreaView>

      {currentCheck && (
        <GlassModal
          visible={stepModal}
          title={`Test ${currentCheck.title}`}
          message={currentCheck.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}
          iconName={currentCheck.icon}
          iconColor={currentCheck.iconColor}
          confirmText="Pass ✓"
          cancelText="Fail ✗"
          confirmVariant="success"
          onConfirm={() => markStatus(currentCheck.id, 'pass')}
          onCancel={() => markStatus(currentCheck.id, 'fail')}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  previewCard: { marginBottom: 16, overflow: 'hidden' },
  preview: {
    height: 180,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  previewContent: { alignItems: 'center', gap: 8 },
  previewText: { color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: '600' },
  previewSub: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  corner: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
  },
  cornerTR: { left: undefined, right: 12, borderLeftWidth: 0, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { top: undefined, bottom: 12, borderTopWidth: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { top: undefined, left: undefined, right: 12, bottom: 12, borderTopWidth: 0, borderLeftWidth: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  checkCard: { marginBottom: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: GLASS.backgroundStrong,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInfo: { flex: 1 },
  checkTitle: { color: TEXT.primary, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  checkDesc: { color: TEXT.muted, fontSize: 12 },
  checkRight: { alignItems: 'center', gap: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  continueBtn: { marginTop: 8 },
});

export default CameraTestScreen;
