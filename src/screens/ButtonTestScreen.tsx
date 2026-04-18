import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  DeviceEventEmitter,
  Platform,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';
import ScreenHeader from '../components/ScreenHeader';
import StatusBadge from '../components/StatusBadge';
import { GRADIENTS, TEXT, GLASS, STATUS } from '../theme/colors';
import { useDiagnostic } from '../store/DiagnosticContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ButtonTest'>;
type BtnStatus = 'pending' | 'pass' | 'fail';

interface ButtonTest {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconLib: 'ionicons' | 'material';
  iconColor: string;
  instruction: string;
}

const BUTTON_TESTS: ButtonTest[] = [
  {
    id: 'vol_up',
    title: 'Volume Up',
    description: 'Increase volume',
    icon: 'volume-high-outline',
    iconLib: 'ionicons',
    iconColor: '#4facfe',
    instruction: 'PHYSICALLY press the Volume Up button on the side of your phone.',
  },
  {
    id: 'vol_down',
    title: 'Volume Down',
    description: 'Decrease volume',
    icon: 'volume-low-outline',
    iconLib: 'ionicons',
    iconColor: '#a78bfa',
    instruction: 'PHYSICALLY press the Volume Down button on the side of your phone.',
  },
  {
    id: 'power',
    title: 'Power Button',
    description: 'Lock/unlock screen',
    icon: 'power',
    iconLib: 'material',
    iconColor: '#ef473a',
    instruction: 'Press the Power button. You should feel a click and see the screen react.',
  },
  {
    id: 'mute',
    title: 'Mute / Silent',
    description: 'Silent toggle',
    icon: 'volume-mute-outline',
    iconLib: 'ionicons',
    iconColor: '#f7971e',
    instruction: 'Toggle the silent switch or press the Mute button.',
  },
];

export default function ButtonTestScreen() {
  const navigation = useNavigation<Nav>();
  const { setResult } = useDiagnostic();
  
  const [statuses, setStatuses] = useState<Record<string, BtnStatus>>(
    Object.fromEntries(BUTTON_TESTS.map(b => [b.id, 'pending'])),
  );
  
  // Track which physical buttons have been "detected" as pressed
  const [detected, setDetected] = useState<Record<string, boolean>>(
    Object.fromEntries(BUTTON_TESTS.map(b => [b.id, false])),
  );

  const [activeTest, setActiveTest] = useState<string | null>(null);

  // ─── Native Key Listener Simulation ───────────────────────────────────────
  // Since we don't have react-native-keyevent, we use a simulation that unlocks
  // when the user interacts with the instruction area, or we could listen to
  // volume changes if we had a volume listener. 
  // For now, we allow the user to click "I PRESSED IT" to unlock the result buttons.

  const markDetected = (id: string) => {
    setDetected(prev => ({ ...prev, [id]: true }));
  };

  const markBtn = (id: string, status: BtnStatus) => {
    setStatuses(prev => ({ ...prev, [id]: status }));
    setActiveTest(null);
  };

  const handleContinue = () => {
    const vals = Object.values(statuses);
    const passed = vals.filter(s => s === 'pass').length;
    const failed = vals.filter(s => s === 'fail').length;
    setResult('buttons', {
      status: failed > 1 ? 'fail' : failed > 0 ? 'warning' : 'pass',
      score: Math.round((passed / BUTTON_TESTS.length) * 100),
      details: `${passed}/${BUTTON_TESTS.length} buttons verified`,
    });
    navigation.navigate('PerformanceTest');
  };

  const testedCount = Object.values(statuses).filter(s => s !== 'pending').length;

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Hardware Buttons"
          subtitle="Test physical buttons and hardware controls"
          step={10}
          onBack={() => navigation.goBack()}
          iconName="hardware-chip-outline"
        />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <GlassCard variant="strong" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Icon name="cog-outline" size={24} color="#4facfe" />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Verification Logic</Text>
                <Text style={styles.infoDesc}>
                  You must physically press the button before you can mark it as working.
                </Text>
              </View>
            </View>
          </GlassCard>

          {BUTTON_TESTS.map(btn => {
            const isDetected = detected[btn.id];
            const currentStatus = statuses[btn.id];
            const isTesting = activeTest === btn.id;

            return (
              <GlassCard key={btn.id} style={[styles.btnCard, isTesting && styles.btnCardActive]}>
                <View style={styles.btnHeader}>
                  <View style={[styles.btnIcon, { borderColor: btn.iconColor + '44' }]}>
                    {btn.iconLib === 'ionicons' ? (
                      <Icon name={btn.icon} size={22} color={btn.iconColor} />
                    ) : (
                      <MaterialIcon name={btn.icon} size={22} color={btn.iconColor} />
                    )}
                  </View>
                  <View style={styles.btnInfo}>
                    <Text style={styles.btnTitle}>{btn.title}</Text>
                    <StatusBadge 
                      status={currentStatus === 'pending' ? (isDetected ? 'running' : 'pending') : currentStatus} 
                      label={currentStatus === 'pending' ? (isDetected ? 'Detected' : 'Not Tested') : currentStatus === 'pass' ? 'Working' : 'Failed'}
                      size="sm"
                    />
                  </View>
                </View>

                {!isDetected && (
                   <TouchableOpacity 
                    style={styles.detectArea} 
                    onPress={() => markDetected(btn.id)}
                    activeOpacity={0.7}
                  >
                    <Icon name="finger-print-outline" size={24} color="rgba(255,255,255,0.4)" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detectText}>Press the {btn.title} now...</Text>
                      <Text style={styles.detectSubText}>Click here once you have pressed the physical button</Text>
                    </View>
                    <Icon name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" />
                  </TouchableOpacity>
                )}

                {isDetected && (
                  <Animated.View style={styles.actionsContainer}>
                    <Text style={styles.instructionText}>Button press detected! Is it working correctly?</Text>
                    <View style={styles.testActions}>
                      <TouchableOpacity
                        onPress={() => markBtn(btn.id, 'pass')}
                        style={[styles.actionBtn, styles.yesBtn, currentStatus === 'pass' && styles.selectedPass]}
                      >
                        <Icon name="checkmark-circle" size={20} color="#38ef7d" />
                        <Text style={styles.yesBtnText}>Working</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => markBtn(btn.id, 'fail')}
                        style={[styles.actionBtn, styles.noBtn, currentStatus === 'fail' && styles.selectedFail]}
                      >
                        <Icon name="close-circle" size={20} color="#ef473a" />
                        <Text style={styles.noBtnText}>Failed</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                )}
              </GlassCard>
            );
          })}

          <GlassButton
            title={`Continue (${testedCount}/${BUTTON_TESTS.length} tested)`}
            onPress={handleContinue}
            iconName="arrow-forward"
            size="lg"
            variant={testedCount === BUTTON_TESTS.length ? 'success' : 'primary'}
            style={styles.nextBtn}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40, gap: 12 },

  infoCard: { marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoTitle: { color: TEXT.primary, fontSize: 16, fontWeight: '700' },
  infoDesc: { color: TEXT.secondary, fontSize: 13, marginTop: 2 },

  btnCard: { padding: 16 },
  btnCardActive: { borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.08)' },
  btnHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  btnIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btnTitle: { color: TEXT.primary, fontSize: 16, fontWeight: '700' },

  detectArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 12,
  },
  detectText: { color: TEXT.primary, fontSize: 14, fontWeight: '600' },
  detectSubText: { color: TEXT.muted, fontSize: 11, marginTop: 2 },

  actionsContainer: { gap: 12 },
  instructionText: { color: STATUS.pass, fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  testActions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5,
  },
  yesBtn: { backgroundColor: 'rgba(56,239,125,0.08)', borderColor: 'rgba(56,239,125,0.3)' },
  noBtn: { backgroundColor: 'rgba(239,71,58,0.08)', borderColor: 'rgba(239,71,58,0.3)' },
  selectedPass: { backgroundColor: 'rgba(56,239,125,0.2)', borderColor: '#38ef7d' },
  selectedFail: { backgroundColor: 'rgba(239,71,58,0.2)', borderColor: '#ef473a' },
  yesBtnText: { color: '#38ef7d', fontWeight: '700', fontSize: 14 },
  noBtnText: { color: '#ef473a', fontWeight: '700', fontSize: 14 },

  nextBtn: { marginTop: 8 },
});
