import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
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
import StatusBadge from '../components/StatusBadge';
import { GRADIENTS, TEXT, GLASS } from '../theme/colors';
import { useDiagnostic } from '../store/DiagnosticContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AudioTest'>;
type CheckStatus = 'pending' | 'pass' | 'fail';

interface AudioCheck {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  instruction: string;
}

const AUDIO_CHECKS: AudioCheck[] = [
  {
    id: 'speaker',
    title: 'Loudspeaker',
    description: 'Main speaker output quality',
    icon: 'volume-high-outline',
    iconColor: '#4facfe',
    instruction: 'Increase volume and listen for clear, distortion-free audio',
  },
  {
    id: 'earpiece',
    title: 'Earpiece',
    description: 'Top speaker for calls',
    icon: 'ear-outline',
    iconColor: '#a78bfa',
    instruction: 'Hold phone to your ear and check call audio quality',
  },
  {
    id: 'microphone',
    title: 'Microphone',
    description: 'Voice recording quality',
    icon: 'mic-outline',
    iconColor: '#38ef7d',
    instruction: 'Speak into the microphone and check for clear recording',
  },
  {
    id: 'headphone',
    title: '3.5mm Jack',
    description: 'Headphone jack (if available)',
    icon: 'headset-outline',
    iconColor: '#f7971e',
    instruction: 'Connect headphones and check audio output',
  },
];

const AudioTestScreen = () => {
  const navigation = useNavigation<Nav>();
  const { setResult } = useDiagnostic();
  const [statuses, setStatuses] = useState<Record<string, CheckStatus>>(
    Object.fromEntries(AUDIO_CHECKS.map(c => [c.id, 'pending'])),
  );
  const [instructionModal, setInstructionModal] = useState(false);
  const [currentCheck, setCurrentCheck] = useState<AudioCheck | null>(null);

  const showInstruction = (check: AudioCheck) => {
    setCurrentCheck(check);
    setInstructionModal(true);
  };

  const markStatus = (id: string, status: CheckStatus) => {
    setStatuses(prev => ({ ...prev, [id]: status }));
  };

  const handleFinish = () => {
    const vals = Object.values(statuses);
    const passed = vals.filter(s => s === 'pass').length;
    const failed = vals.filter(s => s === 'fail').length;
    setResult('audio', {
      status: failed > 0 ? (failed >= 2 ? 'fail' : 'warning') : 'pass',
      score: Math.round((passed / vals.filter(s => s !== 'pending').length || 0) * 100),
      details: `${passed} passed, ${failed} failed`,
    });
    navigation.navigate('CameraTest');
  };

  const testedCount = Object.values(statuses).filter(s => s !== 'pending').length;

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Audio Test"
          subtitle="Test speakers, microphone, and audio output"
          step={5}
          onBack={() => navigation.goBack()}
          iconName="volume-high-outline"
        />
        <View style={styles.content}>
          {/* Volume visual */}
          <GlassCard variant="strong" style={styles.visualCard}>
            <View style={styles.visualRow}>
              <LinearGradient
                colors={['rgba(79,172,254,0.2)', 'rgba(0,242,254,0.1)']}
                style={styles.visualIcon}
              >
                <Icon name="musical-notes-outline" size={36} color="#4facfe" />
              </LinearGradient>
              <View style={styles.visualBars}>
                {[0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6].map((h, i) => (
                  <LinearGradient
                    key={i}
                    colors={['#4facfe', '#00f2fe']}
                    style={[styles.bar, { height: 40 * h }]}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.visualText}>
              Use device controls to adjust volume before testing
            </Text>
          </GlassCard>

          {/* Checks */}
          {AUDIO_CHECKS.map(check => (
            <GlassCard key={check.id} style={styles.checkCard}>
              <View style={styles.checkRow}>
                <View style={[styles.checkIcon, { borderColor: check.iconColor + '44' }]}>
                  <Icon name={check.icon} size={22} color={check.iconColor} />
                </View>
                <View style={styles.checkInfo}>
                  <Text style={styles.checkTitle}>{check.title}</Text>
                  <Text style={styles.checkDesc}>{check.description}</Text>
                </View>
                <View style={styles.checkActions}>
                  {statuses[check.id] === 'pending' ? (
                    <GlassButton
                      title="Test"
                      onPress={() => showInstruction(check)}
                      variant="glass"
                      size="sm"
                    />
                  ) : (
                    <View style={styles.resultBtns}>
                      <TouchableOpacity
                        onPress={() => markStatus(check.id, 'pass')}
                        style={[styles.miniBtn, statuses[check.id] === 'pass' && styles.miniBtnActive]}
                      >
                        <Icon name="checkmark" size={14} color={statuses[check.id] === 'pass' ? '#38ef7d' : TEXT.muted} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => markStatus(check.id, 'fail')}
                        style={[styles.miniBtn, statuses[check.id] === 'fail' && styles.miniBtnFail]}
                      >
                        <Icon name="close" size={14} color={statuses[check.id] === 'fail' ? '#ef473a' : TEXT.muted} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </GlassCard>
          ))}

          <GlassButton
            title={testedCount === 0 ? 'Test Audio Components' : `Continue (${testedCount} tested)`}
            onPress={handleFinish}
            iconName="arrow-forward"
            size="lg"
            variant={testedCount > 0 ? 'primary' : 'glass'}
            style={styles.continueBtn}
          />
        </View>
      </SafeAreaView>

      {currentCheck && (
        <GlassModal
          visible={instructionModal}
          title={`Test ${currentCheck.title}`}
          message={currentCheck.instruction}
          iconName={currentCheck.icon}
          iconColor={currentCheck.iconColor}
          confirmText="Mark Pass"
          cancelText="Mark Fail"
          confirmVariant="success"
          onConfirm={() => {
            markStatus(currentCheck.id, 'pass');
            setInstructionModal(false);
          }}
          onCancel={() => {
            markStatus(currentCheck.id, 'fail');
            setInstructionModal(false);
          }}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1, padding: 20 },
  visualCard: { marginBottom: 16 },
  visualRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 10 },
  visualIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79,172,254,0.3)',
  },
  visualBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 40 },
  bar: { width: 8, borderRadius: 4 },
  visualText: { color: TEXT.secondary, fontSize: 12 },
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
  checkActions: { alignItems: 'flex-end' },
  resultBtns: { flexDirection: 'row', gap: 6 },
  miniBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: GLASS.backgroundStrong,
    borderWidth: 1,
    borderColor: GLASS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBtnActive: { borderColor: '#38ef7d', backgroundColor: 'rgba(56,239,125,0.15)' },
  miniBtnFail: { borderColor: '#ef473a', backgroundColor: 'rgba(239,71,58,0.15)' },
  continueBtn: { marginTop: 8 },
});

export default AudioTestScreen;
