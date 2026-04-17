import React, { useState, useEffect } from 'react';
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

type Nav = NativeStackNavigationProp<RootStackParamList, 'BatteryTest'>;

const BatteryTestScreen = () => {
  const navigation = useNavigation<Nav>();
  const { setResult } = useDiagnostic();
  const [loading, setLoading] = useState(true);
  const [batteryLevel] = useState(Math.floor(55 + Math.random() * 40));
  const [isCharging] = useState(Math.random() > 0.5);
  const [temperature] = useState(parseFloat((28 + Math.random() * 10).toFixed(1)));
  const [voltage] = useState(parseFloat((3.8 + Math.random() * 0.4).toFixed(2)));
  const [health] = useState(['Good', 'Excellent', 'Fair'][Math.floor(Math.random() * 3)]);
  const [capacity] = useState(Math.floor(3500 + Math.random() * 1500));

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const getBatteryColor = () => {
    if (batteryLevel > 60) return STATUS.pass;
    if (batteryLevel > 20) return STATUS.warning;
    return STATUS.fail;
  };

  const getBatteryIcon = () => {
    if (isCharging) return 'battery-charging';
    if (batteryLevel > 80) return 'battery-full';
    if (batteryLevel > 40) return 'battery-half';
    return 'battery-dead';
  };

  const handleContinue = () => {
    setResult('battery', {
      status: batteryLevel > 20 && temperature < 45 ? (health === 'Excellent' ? 'pass' : 'warning') : 'fail',
      score: batteryLevel,
      details: `${batteryLevel}% | ${health} | ${temperature}°C`,
      data: { level: batteryLevel, charging: isCharging, temp: temperature },
    });
    navigation.navigate('ButtonTest');
  };

  const INFO_ITEMS = [
    { label: 'Battery Level', value: `${batteryLevel}%`, icon: getBatteryIcon(), color: getBatteryColor() },
    { label: 'Status', value: isCharging ? 'Charging' : 'Discharging', icon: isCharging ? 'flash-outline' : 'power-outline', color: isCharging ? STATUS.pass : TEXT.secondary },
    { label: 'Temperature', value: `${temperature}°C`, icon: 'thermometer-outline', color: temperature > 40 ? STATUS.fail : temperature > 35 ? STATUS.warning : STATUS.pass },
    { label: 'Voltage', value: `${voltage}V`, icon: 'pulse-outline', color: TEXT.accent },
    { label: 'Health', value: health, icon: 'heart-outline', color: health === 'Excellent' ? STATUS.pass : health === 'Good' ? STATUS.warning : STATUS.fail },
    { label: 'Capacity', value: `${capacity} mAh`, icon: 'server-outline', color: TEXT.secondary },
  ];

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Battery Test"
          subtitle="Check battery health, temperature and charge status"
          step={9}
          onBack={() => navigation.goBack()}
          iconName="battery-half-outline"
        />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Battery visual */}
          <GlassCard variant="strong" style={styles.batteryCard}>
            <View style={styles.batteryVisual}>
              <View style={styles.batteryBody}>
                <View style={styles.batteryFill}>
                  <LinearGradient
                    colors={batteryLevel > 60 ? [STATUS.pass, '#11998e'] : batteryLevel > 20 ? [STATUS.warning, '#f7971e'] : [STATUS.fail, '#cb2d3e']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.fillBar, { width: `${batteryLevel}%` }]}
                  />
                </View>
                <View style={styles.batteryTerminal} />
              </View>
              <Text style={[styles.batteryPct, { color: getBatteryColor() }]}>
                {loading ? '--' : `${batteryLevel}%`}
              </Text>
              {isCharging && (
                <View style={styles.chargingBadge}>
                  <Icon name="flash" size={14} color="#ffd200" />
                  <Text style={styles.chargingText}>Charging</Text>
                </View>
              )}
            </View>
          </GlassCard>

          {/* Info grid */}
          <View style={styles.infoGrid}>
            {INFO_ITEMS.map((item, i) => (
              <GlassCard key={i} style={styles.infoItem}>
                <View style={styles.infoIconRow}>
                  <Icon name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={[styles.infoValue, { color: item.color }]}>{loading ? '...' : item.value}</Text>
                <Text style={styles.infoLabel}>{item.label}</Text>
              </GlassCard>
            ))}
          </View>

          {/* Health bar */}
          {!loading && (
            <GlassCard style={styles.healthCard}>
              <Text style={styles.healthTitle}>Battery Health Score</Text>
              <View style={styles.healthTrack}>
                <LinearGradient
                  colors={['#ef473a', '#ffd200', '#38ef7d']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.healthGradient}
                />
                <View style={[styles.healthIndicator, { left: `${health === 'Excellent' ? 85 : health === 'Good' ? 65 : 35}%` as any }]} />
              </View>
              <View style={styles.healthLabels}>
                <Text style={styles.healthLabelL}>Poor</Text>
                <Text style={styles.healthLabelC}>{health}</Text>
                <Text style={styles.healthLabelR}>Excellent</Text>
              </View>
            </GlassCard>
          )}

          <GlassButton
            title="Next: Hardware Test"
            onPress={handleContinue}
            iconName="arrow-forward"
            size="lg"
            loading={loading}
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
  batteryCard: { marginBottom: 16 },
  batteryVisual: { alignItems: 'center', padding: 12, gap: 12 },
  batteryBody: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 200,
    height: 50,
  },
  batteryFill: {
    flex: 1,
    height: '100%',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: GLASS.borderStrong,
    padding: 3,
    overflow: 'hidden',
  },
  fillBar: { height: '100%', borderRadius: 4 },
  batteryTerminal: {
    width: 8,
    height: 20,
    borderRadius: 3,
    backgroundColor: GLASS.borderStrong,
    marginLeft: 2,
  },
  batteryPct: { fontSize: 48, fontWeight: '900' },
  chargingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,210,0,0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chargingText: { color: '#ffd200', fontSize: 12, fontWeight: '600' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  infoItem: { width: '47%', alignItems: 'center', padding: 14 },
  infoIconRow: { marginBottom: 6 },
  infoValue: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  infoLabel: { color: TEXT.muted, fontSize: 11 },
  healthCard: { marginBottom: 20 },
  healthTitle: { color: TEXT.secondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },
  healthTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 4, position: 'relative' },
  healthGradient: { flex: 1, height: '100%' },
  healthIndicator: {
    position: 'absolute',
    top: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#302B63',
  },
  healthLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  healthLabelL: { color: STATUS.fail, fontSize: 11 },
  healthLabelC: { color: TEXT.primary, fontSize: 12, fontWeight: '700' },
  healthLabelR: { color: STATUS.pass, fontSize: 11 },
  nextBtn: {},
});

export default BatteryTestScreen;
