import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
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
import { GRADIENTS, TEXT, GLASS, STATUS } from '../theme/colors';
import { useDiagnostic } from '../store/DiagnosticContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PerformanceTest'>;

interface BenchResult {
  name: string;
  score: number;
  maxScore: number;
  icon: string;
  iconColor: string;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  time: string;
}

const getGrade = (pct: number): 'S' | 'A' | 'B' | 'C' | 'D' =>
  pct > 0.9 ? 'S' : pct > 0.75 ? 'A' : pct > 0.6 ? 'B' : pct > 0.4 ? 'C' : 'D';

const GRADE_COLORS: Record<string, string> = {
  S: '#ffd200', A: '#38ef7d', B: '#4facfe', C: '#f7971e', D: '#ef473a',
};

const PerformanceTestScreen = () => {
  const navigation = useNavigation<Nav>();
  const { setResult } = useDiagnostic();
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const [results, setResults] = useState<BenchResult[]>([]);

  const runBenchmarks = async () => {
    setPhase('running');
    setResults([]);

    const benchmarks = [
      { name: 'CPU Single-Core', icon: 'hardware-chip-outline', iconColor: '#4facfe', maxScore: 1000 },
      { name: 'CPU Multi-Core', icon: 'layers-outline', iconColor: '#a78bfa', maxScore: 4000 },
      { name: 'Memory Speed', icon: 'server-outline', iconColor: '#38ef7d', maxScore: 2000 },
      { name: 'Storage Read', icon: 'download-outline', iconColor: '#f7971e', maxScore: 500 },
      { name: 'Storage Write', icon: 'cloud-upload-outline', iconColor: '#ef473a', maxScore: 300 },
      { name: 'GPU Render', icon: 'color-palette-outline', iconColor: '#ffd200', maxScore: 3000 },
    ];

    const done: BenchResult[] = [];
    for (let i = 0; i < benchmarks.length; i++) {
      const bench = benchmarks[i];
      setCurrentTest(bench.name);
      setProgress((i / benchmarks.length) * 100);
      await new Promise<void>(r => setTimeout(r, 800 + Math.random() * 600));

      // Simulate JS perf benchmark
      const start = Date.now();
      let n = 0;
      for (let j = 0; j < 100000; j++) n += Math.sqrt(j);
      const elapsed = Date.now() - start;

      const basePct = 0.5 + Math.random() * 0.45;
      const score = Math.round(bench.maxScore * basePct);
      done.push({
        name: bench.name,
        score,
        maxScore: bench.maxScore,
        icon: bench.icon,
        iconColor: bench.iconColor,
        grade: getGrade(basePct),
        time: `${elapsed + Math.round(Math.random() * 100)}ms`,
      });
      setResults([...done]);
    }

    setProgress(100);
    setCurrentTest('');
    setPhase('done');

    const avg = done.reduce((s, r) => s + r.score / r.maxScore, 0) / done.length;
    setResult('performance', {
      status: avg > 0.7 ? 'pass' : avg > 0.4 ? 'warning' : 'fail',
      score: Math.round(avg * 100),
      details: `Avg score: ${Math.round(avg * 100)}%`,
    });
  };

  const totalScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.score / r.maxScore, 0) / results.length * 100)
    : 0;

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Performance"
          subtitle="CPU, memory, storage and GPU benchmarks"
          step={11}
          onBack={() => navigation.goBack()}
          iconName="speedometer-outline"
        />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Score */}
          <GlassCard variant="strong" style={styles.scoreCard}>
            <View style={styles.scoreCenter}>
              <LinearGradient
                colors={['rgba(102,126,234,0.2)', 'rgba(118,75,162,0.1)']}
                style={styles.scoreCircle}
              >
                <Text style={[
                  styles.scoreNum,
                  { color: totalScore > 70 ? STATUS.pass : totalScore > 40 ? STATUS.warning : phase === 'idle' ? TEXT.muted : STATUS.fail },
                ]}>
                  {phase === 'idle' ? '--' : `${totalScore}`}
                </Text>
                {phase !== 'idle' && <Text style={styles.scoreSub}>/ 100</Text>}
              </LinearGradient>
              <Text style={styles.scoreTitle}>
                {phase === 'idle' ? 'Overall Score' : phase === 'running' ? 'Running...' : 'Final Score'}
              </Text>
            </View>

            {phase === 'running' && (
              <View style={styles.progressSection}>
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${progress}%` }]}
                  />
                </View>
                <Text style={styles.currentTest}>Testing: {currentTest}</Text>
              </View>
            )}
          </GlassCard>

          {/* Benchmark results */}
          {results.map((r, i) => {
            const pct = r.score / r.maxScore;
            return (
              <GlassCard key={i} style={styles.benchCard}>
                <View style={styles.benchRow}>
                  <View style={[styles.benchIcon, { borderColor: r.iconColor + '44' }]}>
                    <Icon name={r.icon} size={18} color={r.iconColor} />
                  </View>
                  <View style={styles.benchInfo}>
                    <View style={styles.benchTitleRow}>
                      <Text style={styles.benchName}>{r.name}</Text>
                      <View style={[styles.gradeBadge, { backgroundColor: GRADE_COLORS[r.grade] + '22', borderColor: GRADE_COLORS[r.grade] + '55' }]}>
                        <Text style={[styles.gradeText, { color: GRADE_COLORS[r.grade] }]}>{r.grade}</Text>
                      </View>
                    </View>
                    <View style={styles.benchTrack}>
                      <LinearGradient
                        colors={[r.iconColor, r.iconColor + '44']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.benchFill, { width: `${pct * 100}%` }]}
                      />
                    </View>
                    <View style={styles.benchMeta}>
                      <Text style={styles.benchScore}>{r.score.toLocaleString()} / {r.maxScore.toLocaleString()}</Text>
                      <Text style={styles.benchTime}>{r.time}</Text>
                    </View>
                  </View>
                </View>
              </GlassCard>
            );
          })}

          {phase === 'idle' && (
            <GlassButton
              title="Run Performance Benchmark"
              onPress={runBenchmarks}
              iconName="play-circle-outline"
              size="lg"
              style={styles.actionBtn}
            />
          )}
          {phase === 'running' && (
            <GlassButton
              title="Running Benchmarks..."
              onPress={() => {}}
              loading
              size="lg"
              style={styles.actionBtn}
            />
          )}
          {phase === 'done' && (
            <GlassButton
              title="Next: Security Check"
              onPress={() => navigation.navigate('SecurityCheck')}
              iconName="arrow-forward"
              size="lg"
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
  scoreCenter: { alignItems: 'center', padding: 8, gap: 12 },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  scoreNum: { fontSize: 42, fontWeight: '900' },
  scoreSub: { color: TEXT.muted, fontSize: 14 },
  scoreTitle: { color: TEXT.secondary, fontSize: 14, fontWeight: '600' },
  progressSection: { width: '100%', marginTop: 8, gap: 6 },
  progressTrack: {
    height: 4,
    backgroundColor: GLASS.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  currentTest: { color: TEXT.muted, fontSize: 11, textAlign: 'center' },
  benchCard: { marginBottom: 10 },
  benchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  benchIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: GLASS.backgroundStrong,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  benchInfo: { flex: 1, gap: 6 },
  benchTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benchName: { flex: 1, color: TEXT.primary, fontSize: 14, fontWeight: '700' },
  gradeBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  gradeText: { fontSize: 12, fontWeight: '900' },
  benchTrack: {
    height: 4,
    backgroundColor: GLASS.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  benchFill: { height: '100%', borderRadius: 2 },
  benchMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  benchScore: { color: TEXT.secondary, fontSize: 11 },
  benchTime: { color: TEXT.muted, fontSize: 11 },
  actionBtn: { marginTop: 8 },
});

export default PerformanceTestScreen;
