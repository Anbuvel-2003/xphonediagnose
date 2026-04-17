import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  PermissionsAndroid,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo, { NetInfoStateType, NetInfoWifiState, NetInfoCellularState } from '@react-native-community/netinfo';
import BleManager from 'react-native-ble-manager';
import { RootStackParamList } from '../navigation/types';
import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';
import ScreenHeader from '../components/ScreenHeader';
import StatusBadge from '../components/StatusBadge';
import { GRADIENTS, TEXT, GLASS, STATUS } from '../theme/colors';
import { useDiagnostic } from '../store/DiagnosticContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ConnectivityTest'>;

interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
}

interface WiFiInfo {
  ssid: string | null;
  bssid: string | null;
  strength: number | null;
  ipAddress: string | null;
  frequency: number | null;
  subnet: string | null;
}

interface CellularInfo {
  generation: string | null;
  carrier: string | null;
}

const rssiToSignal = (rssi: number): string => {
  if (rssi >= -50) return 'Excellent';
  if (rssi >= -60) return 'Good';
  if (rssi >= -70) return 'Fair';
  return 'Weak';
};

const freqToBand = (freq: number | null): string => {
  if (!freq) return 'N/A';
  return freq >= 5000 ? '5 GHz' : '2.4 GHz';
};

const ConnectivityTestScreen = () => {
  const navigation = useNavigation<Nav>();
  const { setResult } = useDiagnostic();

  // Network state
  const [netType, setNetType] = useState<string>('checking...');
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [wifiInfo, setWifiInfo] = useState<WiFiInfo | null>(null);
  const [cellularInfo, setCellularInfo] = useState<CellularInfo | null>(null);
  const [netLoading, setNetLoading] = useState(true);

  // BLE state
  const [bleSupported, setBleSupported] = useState(false);
  const [bleScanning, setBleScanning] = useState(false);
  const [bleDevices, setBleDevices] = useState<BLEDevice[]>([]);
  const [bleError, setBleError] = useState<string | null>(null);
  const bleEventSub = useRef<any>(null);


  // — Network info —
  useEffect(() => {
    const fetchNet = async () => {
      setNetLoading(true);
      try {
        const state = await NetInfo.fetch();
        setIsConnected(state.isConnected);
        setNetType(state.type);

        if (state.type === NetInfoStateType.wifi) {
          const ws = state as NetInfoWifiState;
          setWifiInfo({
            ssid: ws.details?.ssid ?? null,
            bssid: ws.details?.bssid ?? null,
            strength: ws.details?.strength ?? null,
            ipAddress: ws.details?.ipAddress ?? null,
            frequency: ws.details?.frequency ?? null,
            subnet: ws.details?.subnet ?? null,
          });
        }

        if (state.type === NetInfoStateType.cellular) {
          const cs = state as NetInfoCellularState;
          setCellularInfo({
            generation: cs.details?.cellularGeneration ?? null,
            carrier: cs.details?.carrier ?? null,
          });
        }
      } catch (e) {
        console.warn('NetInfo error', e);
      } finally {
        setNetLoading(false);
      }
    };

    fetchNet();
    const unsub = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setNetType(state.type);
    });
    return () => unsub();
  }, []);

  // — BLE setup —
  useEffect(() => {
    const initBle = async () => {
      try {
        await BleManager.start({ showAlert: false });
        setBleSupported(true);

        const BleManagerModule = NativeModules.BleManager;
        if (BleManagerModule) {
          const emitter = new NativeEventEmitter(BleManagerModule);
          bleEventSub.current = emitter.addListener(
            'BleManagerDiscoverPeripheral',
            (peripheral: any) => {
              setBleDevices(prev => {
                const exists = prev.find(d => d.id === peripheral.id);
                if (exists) return prev;
                return [
                  ...prev,
                  {
                    id: peripheral.id,
                    name: peripheral.name || 'Unknown Device',
                    rssi: peripheral.rssi ?? -99,
                  },
                ].slice(0, 20);
              });
            },
          );
        }
      } catch {
        setBleSupported(false);
        setBleError('BLE not available on this device');
      }
    };
    initBle();
    return () => bleEventSub.current?.remove();
  }, []);

  const startBleScan = async () => {
    setBleDevices([]);
    setBleError(null);

    if (Platform.OS === 'android' && Number(Platform.Version) >= 31) {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      const allGranted = Object.values(granted).every(
        r => r === PermissionsAndroid.RESULTS.GRANTED,
      );
      if (!allGranted) {
        setBleError('Bluetooth & Location permissions required');
        return;
      }
    } else if (Platform.OS === 'android') {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }

    try {
      setBleScanning(true);
      await BleManager.scan({ seconds: 8, serviceUUIDs: [] });
      setTimeout(() => {
        BleManager.stopScan();
        setBleScanning(false);
      }, 8000);
    } catch (e: any) {
      setBleError(e?.message || 'BLE scan failed');
      setBleScanning(false);
    }
  };

  const handleContinue = () => {
    setResult('connectivity', {
      status: isConnected ? 'pass' : 'fail',
      details: `${netType?.toUpperCase()} · ${wifiInfo?.ssid ?? cellularInfo?.generation ?? 'N/A'} · ${bleDevices.length} BLE devices`,
      data: { type: netType, ssid: wifiInfo?.ssid, bleCount: bleDevices.length },
    });
    navigation.navigate('SensorTest');
  };

  const signalPct = wifiInfo?.strength != null
    ? Platform.OS === 'android' ? wifiInfo.strength : Math.min(Math.round(((wifiInfo.strength + 100) / 60) * 100), 100)
    : null;

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Connectivity"
          subtitle="WiFi, Cellular, BLE scan — live network details"
          step={7}
          onBack={() => navigation.goBack()}
          iconName="wifi-outline"
        />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Connection Status ── */}
          <GlassCard variant="strong" style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? STATUS.pass : STATUS.fail }]} />
              <Text style={styles.statusText}>
                {isConnected === null ? 'Checking...' : isConnected ? 'Connected' : 'Offline'}
              </Text>
              <StatusBadge
                status={isConnected === null ? 'pending' : isConnected ? 'pass' : 'fail'}
                label={netType?.toUpperCase() ?? ''}
                size="sm"
              />
            </View>
          </GlassCard>

          {/* ── Wi-Fi Details ── */}
          <GlassCard
            gradient={['rgba(79,172,254,0.12)', 'rgba(0,242,254,0.04)']}
            style={styles.sectionCard}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { borderColor: '#4facfe44' }]}>
                <Icon name="wifi-outline" size={20} color="#4facfe" />
              </View>
              <Text style={styles.sectionTitle}>Wi-Fi</Text>
              <StatusBadge
                status={netType === 'wifi' && isConnected ? 'pass' : 'pending'}
                label={netType === 'wifi' ? 'Connected' : 'Not Connected'}
                size="sm"
              />
            </View>

            {netLoading ? (
              <Text style={styles.loadingText}>Fetching network info...</Text>
            ) : wifiInfo || netType === 'wifi' ? (
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>SSID</Text>
                  <Text style={styles.detailValue}>{wifiInfo?.ssid ?? 'Hidden'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>BSSID</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>{wifiInfo?.bssid ?? 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>IP Address</Text>
                  <Text style={styles.detailValue}>{wifiInfo?.ipAddress ?? 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Subnet</Text>
                  <Text style={styles.detailValue}>{wifiInfo?.subnet ?? 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Band</Text>
                  <Text style={[styles.detailValue, { color: '#4facfe' }]}>{freqToBand(wifiInfo?.frequency ?? null)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Frequency</Text>
                  <Text style={styles.detailValue}>{wifiInfo?.frequency ? `${wifiInfo.frequency} MHz` : 'N/A'}</Text>
                </View>
                {signalPct !== null && (
                  <View style={styles.signalRow}>
                    <Text style={styles.detailLabel}>Signal Strength</Text>
                    <Text style={[styles.detailValue, { color: signalPct > 60 ? STATUS.pass : STATUS.warning }]}>
                      {rssiToSignal(wifiInfo?.strength ?? -100)} ({signalPct}%)
                    </Text>
                  </View>
                )}
                {signalPct !== null && (
                  <View style={styles.signalBarTrack}>
                    <LinearGradient
                      colors={signalPct > 60 ? ['#38ef7d', '#11998e'] : ['#ffd200', '#f7971e']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.signalBarFill, { width: `${signalPct}%` }]}
                    />
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.naText}>Not connected to Wi-Fi</Text>
            )}
          </GlassCard>

          {/* ── Cellular Details ── */}
          <GlassCard
            gradient={['rgba(56,239,125,0.12)', 'rgba(17,153,142,0.04)']}
            style={styles.sectionCard}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { borderColor: '#38ef7d44' }]}>
                <Icon name="cellular-outline" size={20} color="#38ef7d" />
              </View>
              <Text style={styles.sectionTitle}>Cellular / LTE</Text>
              <StatusBadge
                status={netType === 'cellular' && isConnected ? 'pass' : 'pending'}
                label={netType === 'cellular' ? 'Connected' : 'Not Active'}
                size="sm"
              />
            </View>

            {netLoading ? (
              <Text style={styles.loadingText}>Fetching cellular info...</Text>
            ) : cellularInfo ? (
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Generation</Text>
                  <Text style={[styles.detailValue, { color: '#38ef7d' }]}>
                    {cellularInfo.generation?.toUpperCase() ?? 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Carrier</Text>
                  <Text style={styles.detailValue}>{cellularInfo.carrier ?? 'N/A'}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.naText}>
                {netType === 'wifi' ? 'Using Wi-Fi — switch to cellular to test' : 'No cellular connection detected'}
              </Text>
            )}
          </GlassCard>

          {/* ── BLE Scan ── */}
          <GlassCard
            gradient={['rgba(167,139,250,0.12)', 'rgba(118,75,162,0.04)']}
            style={styles.sectionCard}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { borderColor: '#a78bfa44' }]}>
                <Icon name="bluetooth-outline" size={20} color="#a78bfa" />
              </View>
              <Text style={styles.sectionTitle}>Bluetooth LE Scan</Text>
              {bleScanning && (
                <StatusBadge status="running" label="Scanning" size="sm" />
              )}
              {!bleScanning && bleDevices.length > 0 && (
                <StatusBadge status="pass" label={`${bleDevices.length} found`} size="sm" />
              )}
            </View>

            {bleError && (
              <View style={styles.errorRow}>
                <Icon name="warning-outline" size={14} color={STATUS.warning} />
                <Text style={styles.errorText}>{bleError}</Text>
              </View>
            )}

            {!bleSupported && !bleError && (
              <Text style={styles.naText}>BLE not supported on this device</Text>
            )}

            {bleDevices.length === 0 && !bleScanning && bleSupported && !bleError && (
              <Text style={styles.naText}>Tap "Scan" to discover nearby BLE devices</Text>
            )}

            {/* BLE device list */}
            {bleDevices.map(device => (
              <View key={device.id} style={styles.bleDevice}>
                <View style={styles.bleDeviceLeft}>
                  <Icon
                    name={device.name.toLowerCase().includes('watch') || device.name.toLowerCase().includes('band')
                      ? 'watch-outline'
                      : device.name.toLowerCase().includes('ear') || device.name.toLowerCase().includes('pod')
                      ? 'headset-outline'
                      : 'bluetooth-outline'}
                    size={16}
                    color="#a78bfa"
                  />
                  <View>
                    <Text style={styles.bleName}>{device.name}</Text>
                    <Text style={styles.bleId} numberOfLines={1}>{device.id}</Text>
                  </View>
                </View>
                <View style={styles.bleRssi}>
                  <Text style={[styles.rssiValue, { color: device.rssi > -60 ? STATUS.pass : device.rssi > -75 ? STATUS.warning : STATUS.fail }]}>
                    {device.rssi} dBm
                  </Text>
                  <Text style={styles.rssiLabel}>{rssiToSignal(device.rssi)}</Text>
                </View>
              </View>
            ))}

            {bleSupported && (
              <GlassButton
                title={bleScanning ? 'Scanning BLE...' : bleDevices.length > 0 ? 'Scan Again' : 'Start BLE Scan'}
                onPress={startBleScan}
                loading={bleScanning}
                iconName={bleScanning ? undefined : 'search-outline'}
                variant="glass"
                size="sm"
                style={styles.scanBtn}
              />
            )}
          </GlassCard>

          <GlassButton
            title="Continue to Sensor Test"
            onPress={handleContinue}
            iconName="arrow-forward"
            size="lg"
            style={styles.continueBtn}
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
  statusCard: { marginBottom: 14 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { color: TEXT.primary, fontSize: 16, fontWeight: '700', flex: 1 },
  sectionCard: { marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: GLASS.backgroundStrong,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { flex: 1, color: TEXT.primary, fontSize: 16, fontWeight: '700' },
  loadingText: { color: TEXT.muted, fontSize: 13 },
  naText: { color: TEXT.muted, fontSize: 13, fontStyle: 'italic' },
  detailGrid: { gap: 8 },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { color: TEXT.muted, fontSize: 13 },
  detailValue: { color: TEXT.primary, fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  signalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  signalBarTrack: {
    height: 4,
    backgroundColor: GLASS.background,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  signalBarFill: { height: '100%', borderRadius: 2 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  errorText: { color: STATUS.warning, fontSize: 12 },
  bleDevice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: GLASS.border,
  },
  bleDeviceLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  bleName: { color: TEXT.primary, fontSize: 13, fontWeight: '600' },
  bleId: { color: TEXT.muted, fontSize: 10, maxWidth: 160 },
  bleRssi: { alignItems: 'flex-end' },
  rssiValue: { fontSize: 12, fontWeight: '700' },
  rssiLabel: { color: TEXT.muted, fontSize: 10 },
  scanBtn: { marginTop: 12, alignSelf: 'flex-start' },
  continueBtn: { marginTop: 4 },
});

export default ConnectivityTestScreen;
