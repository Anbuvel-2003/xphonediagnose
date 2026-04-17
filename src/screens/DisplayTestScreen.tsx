import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
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
import { GRADIENTS, TEXT, GLASS } from '../theme/colors';
import { useDiagnostic } from '../store/DiagnosticContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DisplayTest'>;
const { width, height } = Dimensions.get('window');

const COLOR_TESTS = [
  { color: '#FF0000', name: 'Red', icon: 'radio-button-on' },
  { color: '#00FF00', name: 'Green', icon: 'radio-button-on' },
  { color: '#0000FF', name: 'Blue', icon: 'radio-button-on' },
  { color: '#FFFFFF', name: 'White', icon: 'radio-button-on' },
  { color: '#000000', name: 'Black', icon: 'radio-button-on' },
  { color: '#FFFF00', name: 'Yellow', icon: 'radio-button-on' },
];

const DisplayTestScreen = () => {
  const navigation = useNavigation<Nav>();
  const { setResult } = useDiagnostic();
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [testsDone, setTestsDone] = useState<Set<string>>(new Set());
  const [resultModal, setResultModal] = useState(false);

  const handleColorTest = (color: string) => {
    setActiveColor(color);
  };

  const handleColorBack = () => {
    if (activeColor) {
      setTestsDone(prev => new Set([...prev, activeColor]));
      setActiveColor(null);
    }
  };

  const handleFinish = () => setResultModal(true);

  const handlePass = () => {
    setResult('display', { status: 'pass', score: 100, details: 'Display tests passed' });
    setResultModal(false);
    navigation.navigate('TouchTest');
  };

  const handleFail = () => {
    setResult('display', { status: 'fail', score: 0, details: 'Display issues detected' });
    setResultModal(false);
    navigation.navigate('TouchTest');
  };

  // Full screen color test mode
  if (activeColor) {
    return (
      <TouchableOpacity
        style={[styles.fullScreen, { backgroundColor: activeColor }]}
        onPress={handleColorBack}
        activeOpacity={1}
      >
        <SafeAreaView style={styles.fullScreenSafe}>
          <View style={styles.fullScreenHint}>
            <View style={styles.hintBadge}>
              <Icon name="hand-left-outline" size={16} color="#fff" />
              <Text style={styles.hintText}>Tap anywhere to go back</Text>
            </View>
          </View>
          <View style={styles.colorLabel}>
            <Text style={[styles.colorLabelText, { color: activeColor === '#000000' ? '#fff' : '#000' }]}>
              {COLOR_TESTS.find(c => c.color === activeColor)?.name}
            </Text>
            <Text style={[styles.colorSub, { color: activeColor === '#000000' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
              Check for dead pixels or color issues
            </Text>
          </View>
        </SafeAreaView>
      </TouchableOpacity>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Display Test"
          subtitle="Test screen colors and check for dead pixels"
          step={3}
          onBack={() => navigation.goBack()}
          iconName="tv-outline"
        />
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            {/* Screen info */}
            <GlassCard variant="strong" style={styles.infoCard} padding={Platform.select({ ios: 16, android: 20 })}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoValue}>{Math.round(width)}×{Math.round(height)}</Text>
                  <Text style={styles.infoLabel}>Resolution</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoItem}>
                  <Text style={styles.infoValue}>{testsDone.size}/{COLOR_TESTS.length}</Text>
                  <Text style={styles.infoLabel}>Tests Done</Text>
                </View>
              </View>
            </GlassCard>

            {/* Color buttons */}
            <Text style={styles.sectionTitle}>Color Fill Tests</Text>
            <Text style={styles.sectionSub}>Tap each color to fill the screen. Look for dead pixels or incorrect colors.</Text>

            <View style={styles.colorGrid}>
              {COLOR_TESTS.map((item) => (
                <TouchableOpacity
                  key={item.color}
                  onPress={() => handleColorTest(item.color)}
                  activeOpacity={0.8}
                  style={styles.colorBtnWrapper}
                >
                  <View
                    style={[
                      styles.colorBtn,
                      { backgroundColor: item.color },
                      testsDone.has(item.color) && styles.colorBtnDone,
                    ]}
                  >
                    {testsDone.has(item.color) && (
                      <Icon name="checkmark-circle" size={22} color={item.color === '#000000' ? '#fff' : '#000'} />
                    )}
                  </View>
                  <Text style={styles.colorName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <GlassCard variant="strong" style={styles.tipCard} padding={12}>
              <View style={styles.tipRow}>
                <Icon name="bulb-outline" size={18} color="#ffd200" />
                <Text style={styles.tipText}>
                  Look for any dark spots, bright dots, or color bleed during each test
                </Text>
              </View>
            </GlassCard>

            <GlassButton
              title="Mark Test Complete"
              onPress={handleFinish}
              iconName="checkmark-done"
              size="lg"
              disabled={testsDone.size === 0}
              style={styles.doneBtn}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <GlassModal
        visible={resultModal}
        title="Display Test Result"
        message="Did your display pass all color tests? Were there any dead pixels, color bleed, or brightness issues?"
        iconName="tv-outline"
        iconColor="#4facfe"
        confirmText="Pass ✓"
        cancelText="Fail ✗"
        onConfirm={handlePass}
        onCancel={handleFail}
        confirmVariant="success"
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { padding: 20, paddingBottom: 40 },
  fullScreen: { flex: 1 },
  fullScreenSafe: { flex: 1, justifyContent: 'space-between', alignItems: 'center' },
  fullScreenHint: { paddingTop: 60 },
  hintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  hintText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  colorLabel: { paddingBottom: 100, alignItems: 'center' },
  colorLabelText: { fontSize: 36, fontWeight: '900', marginBottom: 8 },
  colorSub: { fontSize: 14, textAlign: 'center' },
  infoCard: { marginBottom: 20 },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingBottom: Platform.OS === 'android' ? 10 : 0,
  },
  infoItem: { flex: 1, alignItems: 'center' },
  infoValue: { color: TEXT.primary, fontSize: 18, fontWeight: '800', marginBottom: 2 },
  infoLabel: { color: TEXT.muted, fontSize: 11, fontWeight: '600' },
  divider: { width: 1, height: 30, backgroundColor: GLASS.border },
  sectionTitle: { color: TEXT.primary, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  sectionSub: { color: TEXT.muted, fontSize: 12, marginBottom: 16, lineHeight: 18 },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    rowGap: Platform.select({ ios: 12, android: 18 }),
    marginBottom: 24,
  },
  colorBtnWrapper: { alignItems: 'center', gap: 6 },
  colorBtn: {
    width: (width - 40 - 30) / 3, // Improved grid calculation
    height: (width - 40 - 30) / 3,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GLASS.border,
  },
  colorBtnDone: { borderColor: '#38ef7d', borderWidth: 2.5 },
  colorName: { color: TEXT.secondary, fontSize: 12, fontWeight: '600' },
  tipCard: { 
    marginBottom: 20,
    minHeight: 50,
    justifyContent: 'center',
  },
  tipRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
  },
  tipText: { 
    color: TEXT.secondary, 
    fontSize: 12, 
    flex: 1, 
    lineHeight: 18,
  },
  doneBtn: { 
    marginTop: 10,
    marginBottom: Platform.OS === 'android' ? 12 : 0 
  },
});

export default DisplayTestScreen;
