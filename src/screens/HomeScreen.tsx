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
import { GRADIENTS, TEXT, GLASS } from '../theme/colors';
import { useDiagnostic } from '../store/DiagnosticContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const FLOW_STEPS = [
  { icon: 'shield-checkmark-outline', label: 'Permissions' },
  { icon: 'phone-portrait-outline', label: 'Device Info' },
  { icon: 'tv-outline', label: 'Display' },
  { icon: 'hand-left-outline', label: 'Touch' },
  { icon: 'volume-high-outline', label: 'Audio' },
  { icon: 'camera-outline', label: 'Camera' },
  { icon: 'wifi-outline', label: 'Connectivity' },
  { icon: 'compass-outline', label: 'Sensors' },
  { icon: 'battery-half-outline', label: 'Battery' },
  { icon: 'hardware-chip-outline', label: 'Hardware' },
  { icon: 'speedometer-outline', label: 'Performance' },
  { icon: 'lock-closed-outline', label: 'Security' },
];

const HomeScreen = () => {
  const navigation = useNavigation<Nav>();
  const { resetAll } = useDiagnostic();

  const handleStart = () => {
    resetAll();
    navigation.navigate('Permissions');
  };

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <LinearGradient
              colors={['rgba(102,126,234,0.25)', 'rgba(118,75,162,0.10)']}
              style={styles.iconCircle}
            >
              <Icon name="pulse" size={56} color="#a78bfa" />
            </LinearGradient>
            <Text style={styles.appName}>XPhone Diagnose</Text>
            <Text style={styles.tagline}>Complete device health check in minutes</Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              { value: '12', label: 'Tests' },
              { value: '100%', label: 'Accurate' },
              { value: 'Free', label: 'Always' },
            ].map((stat, i) => (
              <GlassCard key={i} style={styles.statCard} padding={Platform.OS === 'android' ? 14 : 12}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </GlassCard>
            ))}
          </View>

          {/* Test flow */}
          <GlassCard 
            variant="subtle" 
            style={styles.flowCard} 
            padding={Platform.select({ ios: 14, android: 22 })}
          >
            <Text style={styles.flowTitle}>Diagnostic Flow</Text>
            <View style={styles.flowGrid}>
              {FLOW_STEPS.map((step, i) => (
                <View key={i} style={styles.flowItem}>
                  <View style={styles.flowIconWrap}>
                    <Icon name={step.icon} size={18} color="#a78bfa" />
                  </View>
                  <Text style={styles.flowLabel} numberOfLines={1}>{step.label}</Text>
                </View>
              ))}
            </View>
          </GlassCard>

          {/* CTA */}
          <GlassButton
            title="Start Full Diagnosis"
            onPress={handleStart}
            iconName="play-circle"
            iconSize={22}
            size="lg"
            style={styles.startBtn}
          />


          <Text style={styles.footer}>
            Tests are performed locally on your device.{'\n'}No data is uploaded or shared.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: { 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    paddingBottom: Platform.OS === 'android' ? 80 : 40 
  },
  hero: { alignItems: 'center', marginTop: 10, marginBottom: 16 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
  },
  appName: {
    color: TEXT.primary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tagline: {
    color: TEXT.secondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: TEXT.accent,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: TEXT.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  flowCard: {
    marginBottom: 20,
  },
  flowTitle: {
    color: TEXT.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  flowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    rowGap: Platform.select({ ios: 14, android: 24 }),
    paddingBottom: Platform.OS === 'android' ? 10 : 0,
  },
  flowItem: {
    width: '30%',
    alignItems: 'center',
    gap: 5,
  },
  flowIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: GLASS.backgroundStrong,
    borderWidth: 1,
    borderColor: GLASS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowLabel: {
    color: TEXT.muted,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  startBtn: {
    marginBottom: 16,
    width: '100%',
  },
  footer: {
    color: TEXT.muted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.7,
  },
});

export default HomeScreen;
