import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Dimensions,
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
import ScreenHeader from '../components/ScreenHeader';
import { GRADIENTS, TEXT, GLASS } from '../theme/colors';
import { useDiagnostic } from '../store/DiagnosticContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TouchTest'>;
const { width } = Dimensions.get('window');
const CANVAS_HEIGHT = 260;

interface TouchPoint {
  x: number;
  y: number;
  id: number;
}

const TouchTestScreen = () => {
  const navigation = useNavigation<Nav>();
  const { setResult } = useDiagnostic();
  const [points, setPoints] = useState<TouchPoint[]>([]);
  const [totalTouches, setTotalTouches] = useState(0);
  const [swipeCount, setSwipeCount] = useState(0);
  const [testPassed, setTestPassed] = useState<boolean | null>(null);
  const idRef = useRef(0);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const newPoint = { x: locationX, y: locationY, id: idRef.current++ };
      setPoints(prev => [...prev.slice(-50), newPoint]);
      setTotalTouches(prev => prev + 1);
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      setPoints(prev => [...prev.slice(-50), { x: locationX, y: locationY, id: idRef.current++ }]);
    },
    onPanResponderRelease: () => {
      setSwipeCount(prev => prev + 1);
    },
  });

  const handleClear = () => setPoints([]);

  const handleDone = (passed: boolean) => {
    setTestPassed(passed);
    setResult('touch', {
      status: passed ? 'pass' : 'fail',
      score: passed ? 100 : 30,
      details: `${totalTouches} touches, ${swipeCount} gestures`,
    });
    setTimeout(() => navigation.navigate('AudioTest'), 400);
  };

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Touch & Input"
          subtitle="Test touchscreen responsiveness and multi-touch"
          step={4}
          onBack={() => navigation.goBack()}
          iconName="hand-left-outline"
        />
        <View style={styles.content}>
          {/* Stats */}
          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard}>
              <Icon name="finger-print-outline" size={20} color="#4facfe" />
              <Text style={styles.statValue}>{totalTouches}</Text>
              <Text style={styles.statLabel}>Touches</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <Icon name="swap-horizontal-outline" size={20} color="#a78bfa" />
              <Text style={styles.statValue}>{swipeCount}</Text>
              <Text style={styles.statLabel}>Gestures</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <Icon name="ellipse-outline" size={20} color="#38ef7d" />
              <Text style={styles.statValue}>{points.length}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </GlassCard>
          </View>

          {/* Touch canvas */}
          <View style={styles.canvasWrapper}>
            <View style={styles.canvas} {...panResponder.panHandlers}>
              {/* Grid overlay */}
              {[...Array(4)].map((_, i) => (
                <View key={`h${i}`} style={[styles.gridLine, { top: (CANVAS_HEIGHT / 4) * (i + 1) }]} />
              ))}
              {[...Array(4)].map((_, i) => (
                <View key={`v${i}`} style={[styles.gridLineV, { left: ((width - 40) / 4) * (i + 1) }]} />
              ))}

              {points.length === 0 && (
                <View style={styles.canvasHint}>
                  <Icon name="hand-left-outline" size={32} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.canvasHintText}>Draw, tap, or swipe here</Text>
                </View>
              )}

              {points.map((pt) => (
                <View
                  key={pt.id}
                  style={[
                    styles.touchDot,
                    { left: pt.x - 8, top: pt.y - 8 },
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Icon name="trash-outline" size={16} color={TEXT.secondary} />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <GlassCard variant="subtle" style={styles.tipCard}>
            <View style={styles.tipRow}>
              <Icon name="bulb-outline" size={16} color="#ffd200" />
              <Text style={styles.tipText}>
                Try tapping in corners, drawing lines, and multi-finger gestures to test all zones
              </Text>
            </View>
          </GlassCard>

          <View style={styles.actionRow}>
            <GlassButton
              title="Fail"
              onPress={() => handleDone(false)}
              variant="danger"
              iconName="close-circle-outline"
              style={styles.actionBtn}
            />
            <GlassButton
              title="Pass"
              onPress={() => handleDone(true)}
              variant="success"
              iconName="checkmark-circle-outline"
              style={styles.actionBtn}
              disabled={totalTouches < 3}
            />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1, padding: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { color: TEXT.primary, fontSize: 20, fontWeight: '800' },
  statLabel: { color: TEXT.muted, fontSize: 10 },
  canvasWrapper: { marginBottom: 16 },
  canvas: {
    height: CANVAS_HEIGHT,
    borderRadius: 16,
    backgroundColor: GLASS.background,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  canvasHint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  canvasHintText: { color: 'rgba(255,255,255,0.2)', fontSize: 13 },
  touchDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(167,139,250,0.7)',
    borderWidth: 1.5,
    borderColor: '#a78bfa',
  },
  clearBtn: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  clearText: { color: TEXT.secondary, fontSize: 12 },
  tipCard: { marginBottom: 20 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tipText: { color: TEXT.secondary, fontSize: 12, flex: 1, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1 },
});

export default TouchTestScreen;
