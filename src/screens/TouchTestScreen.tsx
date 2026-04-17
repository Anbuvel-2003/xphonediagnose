import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Alert,
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

type Nav = NativeStackNavigationProp<RootStackParamList, 'TouchTest'>;
const { width, height } = Dimensions.get('window');

// Grid configuration
const COLS = 8;
const ROWS = 14;
const TILE_WIDTH = width / COLS;
const TILE_HEIGHT = height / ROWS;
const TOTAL_TILES = COLS * ROWS;

const TouchTestScreen = () => {
  const navigation = useNavigation<Nav>();
  const { setResult } = useDiagnostic();
  const [clearedTiles, setClearedTiles] = useState<Set<number>>(new Set());
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [totalTouches, setTotalTouches] = useState(0);

  const tiles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < TOTAL_TILES; i++) {
      temp.push(i);
    }
    return temp;
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handleTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
      },
      onPanResponderMove: (evt) => {
        handleTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
      },
    })
  ).current;

  const handleTouch = (x: number, y: number) => {
    const col = Math.floor(x / TILE_WIDTH);
    const row = Math.floor(y / TILE_HEIGHT);
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
      const index = row * COLS + col;
      setClearedTiles((prev) => {
        if (prev.has(index)) return prev;
        const next = new Set(prev);
        next.add(index);
        return next;
      });
      setTotalTouches((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (clearedTiles.size === TOTAL_TILES && TOTAL_TILES > 0) {
      Alert.alert('Success', 'All screen areas verified!', [
        { text: 'Complete', onPress: () => handleDone(true) }
      ]);
    }
  }, [clearedTiles.size]);

  const handleClear = () => {
    setClearedTiles(new Set());
    setTotalTouches(0);
  };

  const handleDone = (passed: boolean) => {
    setResult('touch', {
      status: passed ? 'pass' : 'fail',
      score: passed ? 100 : 30,
      details: `${clearedTiles.size}/${TOTAL_TILES} area cleared`,
    });
    navigation.navigate('AudioTest');
  };

  const progress = Math.round((clearedTiles.size / TOTAL_TILES) * 100);

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {!isFullScreen ? (
        <SafeAreaView style={styles.safe}>
          <ScreenHeader
            title="Touch診断"
            subtitle="Verify every pixel of your display"
            step={4}
            onBack={() => navigation.goBack()}
            iconName="hand-left-outline"
          />
          <View style={styles.content}>
            <View style={styles.statsRow}>
              <GlassCard style={styles.statCard} padding={12}>
                <Text style={styles.statValue}>{progress}%</Text>
                <Text style={styles.statLabel}>Verified</Text>
              </GlassCard>
              <GlassCard style={styles.statCard} padding={12}>
                <Text style={styles.statValue}>{clearedTiles.size}</Text>
                <Text style={styles.statLabel}>Zones Pass</Text>
              </GlassCard>
            </View>

            <TouchableOpacity 
              style={styles.previewCanvas} 
              onPress={() => setIsFullScreen(true)}
              activeOpacity={0.9}
            >
              <View style={styles.previewOverlay}>
                <Icon name="grid-outline" size={40} color={STATUS.running} />
                <Text style={styles.previewText}>Start Full Screen Touch Test</Text>
                <Text style={styles.previewSubText}>Drag to clear all glass tiles</Text>
              </View>
            </TouchableOpacity>

            <GlassCard variant="strong" style={styles.tipCard} padding={12}>
              <View style={styles.tipRow}>
                <Icon name="bulb-outline" size={20} color="#ffd200" />
                <Text style={styles.tipText}>
                  Swipe over the entire screen to clear the glass tiles. If any tile stays, that area has a touch issue.
                </Text>
              </View>
            </GlassCard>

            <View style={styles.actionRow}>
              <GlassButton
                title="Manual Fail"
                onPress={() => handleDone(false)}
                variant="danger"
                style={styles.actionBtn}
              />
              <GlassButton
                title="Pass"
                onPress={() => handleDone(true)}
                variant="success"
                style={styles.actionBtn}
                disabled={progress < 20}
              />
            </View>
          </View>
        </SafeAreaView>
      ) : (
        <View style={styles.fullScreenCanvas} {...panResponder.panHandlers}>
          {/* Tiles Grid */}
          <View style={styles.tileGrid}>
            {tiles.map((index) => (
              <View
                key={index}
                style={[
                  styles.tile,
                  {
                    width: TILE_WIDTH,
                    height: TILE_HEIGHT,
                    backgroundColor: clearedTiles.has(index) ? 'transparent' : GLASS.background,
                    borderColor: clearedTiles.has(index) ? 'rgba(255,255,255,0.02)' : GLASS.border,
                  },
                ]}
              >
                {!clearedTiles.has(index) && (
                  <View style={styles.tileInner} />
                )}
              </View>
            ))}
          </View>
          
          <SafeAreaView style={styles.fullScreenUI} pointerEvents="box-none">
            <View style={styles.fullScreenHeader}>
              <View style={styles.progressBadge}>
                <Text style={styles.progressText}>{progress}% Verified</Text>
              </View>
              <View style={styles.controlRow}>
                <TouchableOpacity style={styles.iconBtn} onPress={handleClear}>
                  <Icon name="refresh-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => setIsFullScreen(false)}>
                  <Icon name="close-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {clearedTiles.size === 0 && (
              <View style={styles.guideContainer} pointerEvents="none">
                <Icon name="hand-left-outline" size={48} color="#fff" />
                <Text style={styles.guideText}>Swipe to clean the whole display</Text>
              </View>
            )}
          </SafeAreaView>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1, padding: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { color: TEXT.primary, fontSize: 24, fontWeight: '800' },
  statLabel: { color: TEXT.muted, fontSize: 11, fontWeight: '600' },
  previewCanvas: {
    height: 260,
    backgroundColor: GLASS.background,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: GLASS.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  previewOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  previewText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  previewSubText: { color: TEXT.muted, fontSize: 13 },
  fullScreenCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F0C29',
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tile: {
    borderWidth: 0.5,
  },
  tileInner: {
    flex: 1,
    margin: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  fullScreenUI: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBadge: {
    backgroundColor: 'rgba(56, 239, 125, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#38ef7d',
  },
  progressText: { color: '#38ef7d', fontWeight: '800', fontSize: 14 },
  controlRow: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  guideText: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: '800', 
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 20,
    borderRadius: 16,
  },
  tipCard: { marginBottom: 20 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipText: { color: TEXT.secondary, fontSize: 12, flex: 1, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1 },
});

export default TouchTestScreen;
