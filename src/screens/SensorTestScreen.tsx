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
import {
  accelerometer,
  gyroscope,
  magnetometer,
  barometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import type { Subscription } from 'rxjs';
import { RootStackParamList } from '../navigation/types';
import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';
import ScreenHeader from '../components/ScreenHeader';
import StatusBadge from '../components/StatusBadge';
import { GRADIENTS, TEXT, GLASS, STATUS } from '../theme/colors';
import { useDiagnostic } from '../store/DiagnosticContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SensorTest'>;

interface AxisValue { axis: string; value: string }
type SensorStatus = 'idle' | 'active' | 'error' | 'unsupported';

interface SensorState {
  id: string;
  title: string;
  icon: string;
  iconColor: string;
  unit: string;
  status: SensorStatus;
  values: AxisValue[];
  rawValues: number[];
}

const mkSensor = (id: string, title: string, icon: string, iconColor: string, unit: string, axes: string[]): SensorState => ({
  id, title, icon, iconColor, unit, status: 'idle',
  values: axes.map(a => ({ axis: a, value: '—' })),
  rawValues: axes.map(() => 0),
});

const SensorTestScreen = () => {
  const navigation = useNavigation<Nav>();
  const { setResult } = useDiagnostic();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const subs = useRef<Subscription[]>([]);

  const [sensors, setSensors] = useState<SensorState[]>([
    mkSensor('accel', 'Accelerometer', 'phone-portrait-outline', '#4facfe', 'm/s²', ['X', 'Y', 'Z']),
    mkSensor('gyro', 'Gyroscope', 'sync-circle-outline', '#a78bfa', 'rad/s', ['X', 'Y', 'Z']),
    mkSensor('magnet', 'Magnetometer', 'compass-outline', '#38ef7d', 'μT', ['X', 'Y', 'Z']),
    mkSensor('baro', 'Barometer', 'thermometer-outline', '#f7971e', 'hPa', ['Pressure']),
  ]);

  const updateSensor = (id: string, vals: number[], status: SensorStatus = 'active') => {
    setSensors(prev =>
      prev.map(s =>
        s.id === id
          ? {
              ...s,
              status,
              rawValues: vals,
              values: s.values.map((v, i) => ({ ...v, value: (vals[i] ?? 0).toFixed(3) })),
            }
          : s,
      ),
    );
  };

  const markError = (id: string) => {
    setSensors(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'error' } : s)),
    );
  };

  const startSensors = () => {
    setRunning(true);

    setUpdateIntervalForType(SensorTypes.accelerometer, 300);
    setUpdateIntervalForType(SensorTypes.gyroscope, 300);
    setUpdateIntervalForType(SensorTypes.magnetometer, 300);
    setUpdateIntervalForType(SensorTypes.barometer, 1000);

    subs.current.push(
      accelerometer.subscribe({
        next: ({ x, y, z }) => updateSensor('accel', [x, y, z]),
        error: () => markError('accel'),
      }),
    );

    subs.current.push(
      gyroscope.subscribe({
        next: ({ x, y, z }) => updateSensor('gyro', [x, y, z]),
        error: () => markError('gyro'),
      }),
    );

    subs.current.push(
      magnetometer.subscribe({
        next: ({ x, y, z }) => updateSensor('magnet', [x, y, z]),
        error: () => markError('magnet'),
      }),
    );

    subs.current.push(
      barometer.subscribe({
        next: ({ pressure }) => updateSensor('baro', [pressure]),
        error: () => markError('baro'),
      }),
    );
  };

  const stopSensors = () => {
    subs.current.forEach(s => s.unsubscribe());
    subs.current = [];
    setRunning(false);
    setDone(true);
    const activeSensors = sensors.filter(s => s.status === 'active').length;
    setResult('sensors', {
      status: activeSensors >= 2 ? 'pass' : activeSensors >= 1 ? 'warning' : 'fail',
      score: Math.round((activeSensors / sensors.length) * 100),
      details: `${activeSensors}/${sensors.length} sensors active`,
    });
  };

  useEffect(() => () => { subs.current.forEach(s => s.unsubscribe()); }, []);

  const getBadgeStatus = (s: SensorStatus) => {
    if (s === 'active') return 'pass' as const;
    if (s === 'error') return 'fail' as const;
    if (s === 'unsupported') return 'warning' as const;
    return 'pending' as const;
  };

  const getBadgeLabel = (s: SensorStatus) => {
    if (s === 'active') return 'Live';
    if (s === 'error') return 'Error';
    if (s === 'unsupported') return 'N/A';
    return 'Idle';
  };

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Sensor Test"
          subtitle="Live readings from accelerometer, gyroscope, magnetometer & barometer"
          step={8}
          onBack={() => navigation.goBack()}
          iconName="compass-outline"
        />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Live indicator */}
          {running && (
            <GlassCard variant="strong" style={styles.liveBanner}>
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE — sensors streaming</Text>
                <Text style={styles.liveHint}>Tilt or move your device</Text>
              </View>
            </GlassCard>
          )}

          {sensors.map(sensor => (
            <GlassCard key={sensor.id} style={styles.sensorCard}>
              <View style={styles.sensorHeader}>
                <View style={[styles.sensorIcon, { borderColor: sensor.iconColor + '44' }]}>
                  <Icon name={sensor.icon} size={20} color={sensor.iconColor} />
                </View>
                <Text style={styles.sensorTitle}>{sensor.title}</Text>
                <StatusBadge
                  status={getBadgeStatus(sensor.status)}
                  label={getBadgeLabel(sensor.status)}
                  size="sm"
                />
              </View>

              {/* Value chips */}
              <View style={styles.valuesRow}>
                {sensor.values.map((v, i) => (
                  <View key={i} style={styles.valueChip}>
                    <Text style={styles.valueAxis}>{v.axis}</Text>
                    <Text style={[styles.valueNum, { color: sensor.status === 'active' ? sensor.iconColor : TEXT.muted }]}>
                      {v.value}
                    </Text>
                    <Text style={styles.valueUnit}>{sensor.unit}</Text>
                  </View>
                ))}
              </View>

              {/* Bar visualization for 3-axis sensors */}
              {sensor.status === 'active' && sensor.rawValues.length === 3 && (
                <View style={styles.bars}>
                  {(['X', 'Y', 'Z'] as const).map((axis, i) => {
                    const maxVal = sensor.id === 'magnet' ? 100 : sensor.id === 'accel' ? 20 : 8;
                    const pct = Math.min(Math.abs(sensor.rawValues[i]) / maxVal, 1);
                    const barColors = [
                      [sensor.iconColor, sensor.iconColor + '88'],
                      ['#a78bfa', '#a78bfa88'],
                      ['#38ef7d', '#38ef7d88'],
                    ];
                    return (
                      <View key={axis} style={styles.barRow}>
                        <Text style={styles.barLabel}>{axis}</Text>
                        <View style={styles.barTrack}>
                          <LinearGradient
                            colors={barColors[i]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.barFill, { width: `${pct * 100}%` }]}
                          />
                        </View>
                        <Text style={styles.barVal}>{sensor.rawValues[i]?.toFixed(2)}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Barometer special display */}
              {sensor.status === 'active' && sensor.id === 'baro' && (
                <View style={styles.baroDisplay}>
                  <LinearGradient
                    colors={['rgba(247,151,30,0.15)', 'rgba(255,210,0,0.05)']}
                    style={styles.baroGauge}
                  >
                    <Text style={[styles.baroValue, { color: sensor.iconColor }]}>
                      {sensor.rawValues[0]?.toFixed(1)}
                    </Text>
                    <Text style={styles.baroUnit}>hPa</Text>
                    <Text style={styles.baroAlt}>
                      ~{Math.round(44330 * (1 - Math.pow(sensor.rawValues[0] / 1013.25, 0.1903)))}m altitude
                    </Text>
                  </LinearGradient>
                </View>
              )}

              {sensor.status === 'error' && (
                <View style={styles.errorRow}>
                  <Icon name="warning-outline" size={14} color={STATUS.warning} />
                  <Text style={styles.errorText}>Sensor unavailable on this device</Text>
                </View>
              )}
            </GlassCard>
          ))}

          {!running && !done && (
            <GlassButton
              title="Start Live Sensor Reading"
              onPress={startSensors}
              iconName="play-circle-outline"
              size="lg"
              style={styles.actionBtn}
            />
          )}
          {running && (
            <GlassButton
              title="Stop & Save Results"
              onPress={stopSensors}
              iconName="stop-circle-outline"
              variant="danger"
              size="lg"
              style={styles.actionBtn}
            />
          )}
          {done && (
            <GlassButton
              title="Next: Battery Test"
              onPress={() => navigation.navigate('BatteryTest')}
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
  liveBanner: { marginBottom: 12 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: STATUS.pass,
  },
  liveText: { color: STATUS.pass, fontSize: 13, fontWeight: '700', flex: 1 },
  liveHint: { color: TEXT.muted, fontSize: 11 },
  sensorCard: { marginBottom: 12 },
  sensorHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sensorIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: GLASS.backgroundStrong,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorTitle: { flex: 1, color: TEXT.primary, fontSize: 15, fontWeight: '700' },
  valuesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  valueChip: {
    flex: 1,
    minWidth: 70,
    backgroundColor: GLASS.backgroundStrong,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  valueAxis: { color: TEXT.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 3 },
  valueNum: { fontSize: 15, fontWeight: '800', marginBottom: 1 },
  valueUnit: { color: TEXT.muted, fontSize: 9 },
  bars: { gap: 5 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { color: TEXT.muted, fontSize: 10, fontWeight: '700', width: 12 },
  barTrack: {
    flex: 1,
    height: 4,
    backgroundColor: GLASS.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 2 },
  barVal: { color: TEXT.muted, fontSize: 10, width: 44, textAlign: 'right' },
  baroDisplay: { borderRadius: 10, overflow: 'hidden', marginTop: 4 },
  baroGauge: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 2,
  },
  baroValue: { fontSize: 32, fontWeight: '900' },
  baroUnit: { color: TEXT.secondary, fontSize: 13 },
  baroAlt: { color: TEXT.muted, fontSize: 11, marginTop: 4 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  errorText: { color: STATUS.warning, fontSize: 12 },
  actionBtn: { marginTop: 4 },
});

export default SensorTestScreen;
