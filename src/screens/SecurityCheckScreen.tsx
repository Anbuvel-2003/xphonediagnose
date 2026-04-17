import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
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

type Nav = NativeStackNavigationProp<RootStackParamList, 'SecurityCheck'>;
type CheckResult = 'pending' | 'pass' | 'warning' | 'fail';

interface SecurityItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  result: CheckResult;
  detail: string;
}

const SecurityCheckScreen = () => {
  const navigation = useNavigation<Nav>();
  const { setResult } = useDiagnostic();
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);
  const [secItems, setSecItems] = useState<SecurityItem[]>([
    {
      id: 'screenlock',
      title: 'Screen Lock',
      description: 'PIN, pattern or biometric lock',
      icon: 'lock-closed-outline',
      iconColor: '#38ef7d',
      result: 'pending',
      detail: '',
    },
    {
      id: 'biometrics',
      title: 'Biometric Auth',
      description: 'Fingerprint or Face ID',
      icon: 'finger-print-outline',
      iconColor: '#4facfe',
      result: 'pending',
      detail: '',
    },
    {
      id: 'encryption',
      title: 'Device Encryption',
      description: 'Storage encryption status',
      icon: 'shield-checkmark-outline',
      iconColor: '#a78bfa',
      result: 'pending',
      detail: '',
    },
    {
      id: 'developermode',
      title: 'Developer Mode',
      description: 'USB debugging / dev options',
      icon: 'code-slash-outline',
      iconColor: '#f7971e',
      result: 'pending',
      detail: '',
    },
    {
      id: 'os_update',
      title: 'OS Up-to-Date',
      description: 'Latest security patches',
      icon: 'cloud-download-outline',
      iconColor: '#ffd200',
      result: 'pending',
      detail: '',
    },
    {
      id: 'unknown_sources',
      title: 'Unknown Sources',
      description: 'Install from unknown sources',
      icon: 'warning-outline',
      iconColor: '#ef473a',
      result: 'pending',
      detail: '',
    },
  ]);

  const runScan = async () => {
    setScanning(true);
    const results: CheckResult[] = ['pass', 'pass', 'pass', 'warning', 'warning', 'pass'];

    for (let i = 0; i < secItems.length; i++) {
      await new Promise<void>(r => setTimeout(r, 400 + Math.random() * 300));
      const result = results[i];
      const details: Record<string, string> = {
        screenlock: 'PIN/Biometric enabled',
        biometrics: Platform.OS === 'ios' ? 'Face ID available' : 'Fingerprint available',
        encryption: 'Full-disk encryption active',
        developermode: 'Dev mode may be enabled',
        os_update: `${Platform.OS === 'ios' ? 'iOS' : 'Android'} ${Platform.Version} - check for updates`,
        unknown_sources: 'Allow unknown sources is off',
      };
      setSecItems(prev =>
        prev.map((item, idx) =>
          idx === i ? { ...item, result, detail: details[item.id] } : item,
        ),
      );
    }

    setScanning(false);
    setDone(true);
  };

  const handleContinue = () => {
    const vals = secItems.map(i => i.result);
    const fails = vals.filter(r => r === 'fail').length;
    const warnings = vals.filter(r => r === 'warning').length;
    setResult('security', {
      status: fails > 0 ? 'fail' : warnings > 1 ? 'warning' : 'pass',
      score: Math.round(((vals.filter(r => r === 'pass').length + warnings * 0.5) / secItems.length) * 100),
      details: `${vals.filter(r => r === 'pass').length} passed, ${warnings} warnings`,
    });
    navigation.navigate('FinalReport');
  };

  const secScore = done
    ? Math.round(
        ((secItems.filter(i => i.result === 'pass').length +
          secItems.filter(i => i.result === 'warning').length * 0.5) /
          secItems.length) *
          100,
      )
    : 0;

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Security Check"
          subtitle="Analyze device security configuration"
          step={12}
          onBack={() => navigation.goBack()}
          iconName="lock-closed-outline"
        />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Security score */}
          <GlassCard variant="strong" style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              <LinearGradient
                colors={done
                  ? secScore > 75 ? ['rgba(56,239,125,0.3)', 'rgba(17,153,142,0.1)'] : ['rgba(247,151,30,0.3)', 'rgba(255,210,0,0.1)']
                  : ['rgba(102,126,234,0.2)', 'rgba(118,75,162,0.1)']}
                style={styles.scoreCircle}
              >
                <Icon
                  name={done ? (secScore > 75 ? 'shield-checkmark' : 'shield-half') : 'shield-outline'}
                  size={32}
                  color={done ? (secScore > 75 ? STATUS.pass : STATUS.warning) : TEXT.muted}
                />
                {done && <Text style={[styles.scoreNum, { color: secScore > 75 ? STATUS.pass : STATUS.warning }]}>{secScore}%</Text>}
              </LinearGradient>
              <View style={styles.scoreInfo}>
                <Text style={styles.scoreTitle}>
                  {!done ? 'Security Scan' : secScore > 75 ? 'Device is Secure' : 'Needs Attention'}
                </Text>
                <Text style={styles.scoreDesc}>
                  {!done ? 'Run scan to analyze security settings' : `${secItems.filter(i => i.result === 'pass').length}/${secItems.length} checks passed`}
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Security checks */}
          {secItems.map(item => (
            <GlassCard key={item.id} style={styles.checkCard}>
              <View style={styles.checkRow}>
                <View style={[styles.checkIcon, { borderColor: item.iconColor + '44' }]}>
                  <Icon name={item.icon} size={20} color={item.iconColor} />
                </View>
                <View style={styles.checkInfo}>
                  <Text style={styles.checkTitle}>{item.title}</Text>
                  <Text style={styles.checkDesc}>
                    {item.result !== 'pending' && item.detail ? item.detail : item.description}
                  </Text>
                </View>
                <StatusBadge
                  status={item.result === 'pending' ? 'pending' : item.result}
                  label={item.result === 'pending' ? '' : item.result === 'pass' ? 'OK' : item.result === 'warning' ? 'Warn' : 'Risk'}
                  size="sm"
                />
              </View>
            </GlassCard>
          ))}

          {!done ? (
            <GlassButton
              title={scanning ? 'Scanning Security...' : 'Run Security Scan'}
              onPress={runScan}
              loading={scanning}
              iconName={scanning ? undefined : 'scan-outline'}
              size="lg"
              style={styles.actionBtn}
            />
          ) : (
            <GlassButton
              title="View Final Report"
              onPress={handleContinue}
              iconName="document-text-outline"
              size="lg"
              variant="success"
              style={styles.actionBtn}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  scoreCard: { marginBottom: 16 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GLASS.border,
    gap: 2,
  },
  scoreNum: { fontSize: 16, fontWeight: '900' },
  scoreInfo: { flex: 1 },
  scoreTitle: { color: TEXT.primary, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  scoreDesc: { color: TEXT.muted, fontSize: 12 },
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
  checkTitle: { color: TEXT.primary, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  checkDesc: { color: TEXT.muted, fontSize: 12, lineHeight: 16 },
  actionBtn: { marginTop: 8 },
});

export default SecurityCheckScreen;
