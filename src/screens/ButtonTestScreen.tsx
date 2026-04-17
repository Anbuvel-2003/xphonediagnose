import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
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
    id: 'power',
    title: 'Power Button',
    description: 'Lock/unlock screen',
    icon: 'power',
    iconLib: 'material',
    iconColor: '#ef473a',
    instruction: 'Press the power/sleep button. The screen should turn off and back on.',
  },
  {
    id: 'vol_up',
    title: 'Volume Up',
    description: 'Increase volume',
    icon: 'volume-high-outline',
    iconLib: 'ionicons',
    iconColor: '#4facfe',
    instruction: 'Press the volume up button. Volume should increase.',
  },
  {
    id: 'vol_down',
    title: 'Volume Down',
    description: 'Decrease volume',
    icon: 'volume-low-outline',
    iconLib: 'ionicons',
    iconColor: '#a78bfa',
    instruction: 'Press the volume down button. Volume should decrease.',
  },
  {
    id: 'mute',
    title: 'Mute / Silent',
    description: 'Mute toggle (iOS) or volume mute',
    icon: 'volume-mute-outline',
    iconLib: 'ionicons',
    iconColor: '#f7971e',
    instruction: 'Toggle the mute/silent switch or press mute. Audio should be silenced.',
  },
  {
    id: 'home',
    title: 'Home Button',
    description: 'Physical home (if available)',
    icon: 'home-outline',
    iconLib: 'ionicons',
    iconColor: '#38ef7d',
    instruction: 'Press the home button (if your device has one). Should navigate to home screen.',
  },
];

const ButtonTestScreen = () => {
  const navigation = useNavigation<Nav>();
  const { setResult } = useDiagnostic();
  const [statuses, setStatuses] = useState<Record<string, BtnStatus>>(
    Object.fromEntries(BUTTON_TESTS.map(b => [b.id, 'pending'])),
  );

  const markBtn = (id: string, status: BtnStatus) => {
    setStatuses(prev => ({ ...prev, [id]: status }));
  };

  const handleContinue = () => {
    const vals = Object.values(statuses);
    const passed = vals.filter(s => s === 'pass').length;
    const failed = vals.filter(s => s === 'fail').length;
    setResult('buttons', {
      status: failed > 1 ? 'fail' : failed > 0 ? 'warning' : 'pass',
      score: Math.round((passed / Math.max(vals.filter(s => s !== 'pending').length, 1)) * 100),
      details: `${passed} working, ${failed} failed`,
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
          <GlassCard variant="strong" style={styles.introCard}>
            <View style={styles.introRow}>
              <Icon name="information-circle-outline" size={22} color="#4facfe" />
              <Text style={styles.introText}>
                Press each physical button as instructed, then mark it as pass or fail.
              </Text>
            </View>
          </GlassCard>

          {BUTTON_TESTS.map(btn => (
            <GlassCard key={btn.id} style={styles.btnCard}>
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
                  <Text style={styles.btnDesc}>{btn.description}</Text>
                </View>
                {statuses[btn.id] !== 'pending' && (
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: statuses[btn.id] === 'pass' ? STATUS.pass : STATUS.fail },
                  ]} />
                )}
              </View>

              <Text style={styles.instruction}>{btn.instruction}</Text>

              <View style={styles.testActions}>
                <TouchableOpacity
                  onPress={() => markBtn(btn.id, 'pass')}
                  style={[
                    styles.actionBtn,
                    statuses[btn.id] === 'pass' && styles.actionBtnPass,
                  ]}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={statuses[btn.id] === 'pass' ? ['rgba(56,239,125,0.3)', 'rgba(17,153,142,0.2)'] : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                    style={styles.actionBtnGrad}
                  >
                    <Icon name="checkmark-circle-outline" size={18} color={statuses[btn.id] === 'pass' ? STATUS.pass : TEXT.muted} />
                    <Text style={[styles.actionBtnText, { color: statuses[btn.id] === 'pass' ? STATUS.pass : TEXT.muted }]}>
                      Working
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => markBtn(btn.id, 'fail')}
                  style={[
                    styles.actionBtn,
                    statuses[btn.id] === 'fail' && styles.actionBtnFail,
                  ]}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={statuses[btn.id] === 'fail' ? ['rgba(239,71,58,0.3)', 'rgba(203,45,62,0.2)'] : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                    style={styles.actionBtnGrad}
                  >
                    <Icon name="close-circle-outline" size={18} color={statuses[btn.id] === 'fail' ? STATUS.fail : TEXT.muted} />
                    <Text style={[styles.actionBtnText, { color: statuses[btn.id] === 'fail' ? STATUS.fail : TEXT.muted }]}>
                      Not Working
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))}

          <GlassButton
            title={`Continue (${testedCount}/${BUTTON_TESTS.length} tested)`}
            onPress={handleContinue}
            iconName="arrow-forward"
            size="lg"
            style={styles.nextBtn}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  introCard: { marginBottom: 16 },
  introRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  introText: { flex: 1, color: TEXT.secondary, fontSize: 13, lineHeight: 19 },
  btnCard: { marginBottom: 10 },
  btnHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  btnIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: GLASS.backgroundStrong,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInfo: { flex: 1 },
  btnTitle: { color: TEXT.primary, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  btnDesc: { color: TEXT.muted, fontSize: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  instruction: {
    color: TEXT.secondary,
    fontSize: 13,
    lineHeight: 19,
    backgroundColor: GLASS.backgroundSubtle,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  testActions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
  },
  actionBtnPass: { borderColor: STATUS.pass + '66' },
  actionBtnFail: { borderColor: STATUS.fail + '66' },
  actionBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
  nextBtn: { marginTop: 8 },
});

export default ButtonTestScreen;
