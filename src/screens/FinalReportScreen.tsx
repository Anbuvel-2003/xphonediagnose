import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import { GRADIENTS, TEXT, GLASS, STATUS } from '../theme/colors';
import { useDiagnostic, DiagnosticState } from '../store/DiagnosticContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'FinalReport'>;
const { width } = Dimensions.get('window');

const RESULT_META: Record<keyof DiagnosticState, { label: string; icon: string; iconColor: string }> = {
  permissions: { label: 'Permissions', icon: 'shield-checkmark-outline', iconColor: '#a78bfa' },
  deviceInfo: { label: 'Device Info', icon: 'phone-portrait-outline', iconColor: '#4facfe' },
  display: { label: 'Display', icon: 'tv-outline', iconColor: '#38ef7d' },
  touch: { label: 'Touch & Input', icon: 'hand-left-outline', iconColor: '#ffd200' },
  audio: { label: 'Audio', icon: 'volume-high-outline', iconColor: '#f7971e' },
  camera: { label: 'Camera', icon: 'camera-outline', iconColor: '#4facfe' },
  connectivity: { label: 'Connectivity', icon: 'wifi-outline', iconColor: '#38ef7d' },
  sensors: { label: 'Sensors', icon: 'compass-outline', iconColor: '#a78bfa' },
  battery: { label: 'Battery', icon: 'battery-half-outline', iconColor: '#ffd200' },
  buttons: { label: 'Hardware', icon: 'hardware-chip-outline', iconColor: '#ef473a' },
  performance: { label: 'Performance', icon: 'speedometer-outline', iconColor: '#4facfe' },
  security: { label: 'Security', icon: 'lock-closed-outline', iconColor: '#38ef7d' },
};

const FinalReportScreen = () => {
  const navigation = useNavigation<Nav>();
  const { results, getOverallScore, resetAll } = useDiagnostic();
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const overallScore = getOverallScore();

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scoreAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const getScoreGrade = () => {
    if (overallScore >= 90) return { label: 'Excellent', color: STATUS.pass, icon: 'star' };
    if (overallScore >= 75) return { label: 'Good', color: '#4facfe', icon: 'thumbs-up' };
    if (overallScore >= 50) return { label: 'Fair', color: STATUS.warning, icon: 'alert-circle' };
    return { label: 'Needs Repair', color: STATUS.fail, icon: 'build' };
  };

  const grade = getScoreGrade();
  const passCount = Object.values(results).filter(r => r.status === 'pass').length;
  const warnCount = Object.values(results).filter(r => r.status === 'warning').length;
  const failCount = Object.values(results).filter(r => r.status === 'fail').length;

  const handleRetry = () => {
    resetAll();
    navigation.navigate('Home');
  };

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <Text style={styles.reportTitle}>Diagnostic Report</Text>
            <Text style={styles.reportDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          </Animated.View>

          {/* Score hero */}
          <Animated.View style={{ transform: [{ scale: scoreAnim }] }}>
            <GlassCard variant="strong" style={styles.scoreCard}>
              <LinearGradient
                colors={['rgba(102,126,234,0.15)', 'rgba(118,75,162,0.08)']}
                style={styles.scoreGradient}
              >
                <View style={styles.scoreCircleWrap}>
                  <LinearGradient
                    colors={[grade.color + '33', grade.color + '11']}
                    style={styles.scoreCircle}
                  >
                    <Text style={[styles.scoreNum, { color: grade.color }]}>{overallScore}</Text>
                    <Text style={styles.scoreLabel}>/ 100</Text>
                  </LinearGradient>
                  <View style={[styles.gradeBadge, { backgroundColor: grade.color + '22', borderColor: grade.color + '55' }]}>
                    <Icon name={grade.icon} size={16} color={grade.color} />
                    <Text style={[styles.gradeText, { color: grade.color }]}>{grade.label}</Text>
                  </View>
                </View>

                <View style={styles.statsBubbles}>
                  <View style={styles.statBubble}>
                    <Text style={[styles.statNum, { color: STATUS.pass }]}>{passCount}</Text>
                    <Text style={styles.statLabel}>Passed</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBubble}>
                    <Text style={[styles.statNum, { color: STATUS.warning }]}>{warnCount}</Text>
                    <Text style={styles.statLabel}>Warnings</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBubble}>
                    <Text style={[styles.statNum, { color: STATUS.fail }]}>{failCount}</Text>
                    <Text style={styles.statLabel}>Failed</Text>
                  </View>
                </View>
              </LinearGradient>
            </GlassCard>
          </Animated.View>

          {/* Score bar */}
          <GlassCard style={styles.barCard}>
            <Text style={styles.barTitle}>Overall Health Score</Text>
            <View style={styles.barTrack}>
              <LinearGradient
                colors={overallScore > 70 ? [STATUS.pass, '#11998e'] : overallScore > 40 ? [STATUS.warning, '#f7971e'] : [STATUS.fail, '#cb2d3e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.barFill, { width: `${overallScore}%` }]}
              />
            </View>
          </GlassCard>

          {/* Individual results */}
          <Text style={styles.sectionTitle}>Test Results</Text>
          {(Object.keys(RESULT_META) as (keyof DiagnosticState)[]).map(key => {
            const meta = RESULT_META[key];
            const result = results[key];
            const statusMap: Record<string, 'pass' | 'fail' | 'warning' | 'pending'> = {
              pass: 'pass', fail: 'fail', warning: 'warning', pending: 'pending', skipped: 'pending',
            };
            return (
              <GlassCard key={key} style={styles.resultItem}>
                <View style={styles.resultRow}>
                  <View style={[styles.resultIcon, { borderColor: meta.iconColor + '44' }]}>
                    <Icon name={meta.icon} size={18} color={meta.iconColor} />
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultLabel}>{meta.label}</Text>
                    {result.details && (
                      <Text style={styles.resultDetail}>{result.details}</Text>
                    )}
                  </View>
                  <StatusBadge
                    status={statusMap[result.status] || 'pending'}
                    label={result.status === 'pass' ? 'Pass' : result.status === 'fail' ? 'Fail' : result.status === 'warning' ? 'Warn' : 'N/A'}
                    size="sm"
                  />
                </View>
                {result.score !== undefined && (
                  <View style={styles.miniBarTrack}>
                    <LinearGradient
                      colors={[meta.iconColor, meta.iconColor + '44']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.miniBarFill, { width: `${result.score}%` }]}
                    />
                  </View>
                )}
              </GlassCard>
            );
          })}

          {/* Actions */}
          <View style={styles.actions}>
            <GlassButton
              title="Run Again"
              onPress={handleRetry}
              iconName="refresh-outline"
              variant="glass"
              style={styles.actionBtn}
            />
            <GlassButton
              title="Done"
              onPress={() => navigation.navigate('Home')}
              iconName="checkmark-circle-outline"
              variant="success"
              style={styles.actionBtn}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 50 },
  header: { marginBottom: 20, marginTop: 8 },
  reportTitle: { color: TEXT.primary, fontSize: 28, fontWeight: '900', letterSpacing: 0.3 },
  reportDate: { color: TEXT.muted, fontSize: 13, marginTop: 4 },
  scoreCard: { marginBottom: 12, overflow: 'hidden' },
  scoreGradient: { borderRadius: 14 },
  scoreCircleWrap: { alignItems: 'center', paddingTop: 20, paddingBottom: 16, gap: 12 },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GLASS.border,
    gap: 0,
  },
  scoreNum: { fontSize: 52, fontWeight: '900', lineHeight: 56 },
  scoreLabel: { color: TEXT.muted, fontSize: 14 },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  gradeText: { fontSize: 14, fontWeight: '700' },
  statsBubbles: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    width: '100%',
    justifyContent: 'space-around',
  },
  statBubble: { alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '900' },
  statLabel: { color: TEXT.muted, fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: GLASS.border },
  barCard: { marginBottom: 20 },
  barTitle: { color: TEXT.secondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },
  barTrack: {
    height: 8,
    backgroundColor: GLASS.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
  sectionTitle: {
    color: TEXT.secondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  resultItem: { marginBottom: 8 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: GLASS.backgroundStrong,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: { flex: 1 },
  resultLabel: { color: TEXT.primary, fontSize: 14, fontWeight: '700' },
  resultDetail: { color: TEXT.muted, fontSize: 11, marginTop: 1 },
  miniBarTrack: {
    height: 2,
    backgroundColor: GLASS.background,
    borderRadius: 1,
    overflow: 'hidden',
  },
  miniBarFill: { height: '100%', borderRadius: 1 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actionBtn: { flex: 1 },
});

export default FinalReportScreen;
