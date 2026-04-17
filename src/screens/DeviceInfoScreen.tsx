import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import DeviceInfo from 'react-native-device-info';
import { RootStackParamList } from '../navigation/types';
import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';
import ScreenHeader from '../components/ScreenHeader';
import { GRADIENTS, TEXT, GLASS } from '../theme/colors';
import { useDiagnostic } from '../store/DiagnosticContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DeviceInfo'>;
const { width } = Dimensions.get('window');

interface InfoGroup {
  title: string;
  icon: string;
  iconColor: string;
  items: { label: string; value: string }[];
}

const formatBytes = (bytes: number): string => {
  if (bytes <= 0) return 'N/A';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
};

const DeviceInfoScreen = () => {
  const navigation = useNavigation<Nav>();
  const { setResult } = useDiagnostic();
  const [groups, setGroups] = useState<InfoGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const collect = async () => {
      try {
        const [
          deviceName,
          manufacturer,
          totalMemory,
          usedMemory,
          totalDisk,
          freeDisk,
          batteryLevel,
          isCharging,
          buildId,
          apiLevel,
          carrier,
          ipAddress,
          isCameraPresent,
          isTablet,
          isEmulator,
        ] = await Promise.all([
          DeviceInfo.getDeviceName(),
          DeviceInfo.getManufacturer(),
          DeviceInfo.getTotalMemory(),
          DeviceInfo.getUsedMemory(),
          DeviceInfo.getTotalDiskCapacity(),
          DeviceInfo.getFreeDiskStorage(),
          DeviceInfo.getBatteryLevel(),
          DeviceInfo.isBatteryCharging(),
          DeviceInfo.getBuildId(),
          Platform.OS === 'android' ? DeviceInfo.getApiLevel() : Promise.resolve(0),
          DeviceInfo.getCarrier(),
          DeviceInfo.getIpAddress(),
          DeviceInfo.isCameraPresent(),
          Promise.resolve(DeviceInfo.isTablet()),
          DeviceInfo.isEmulator(),
        ]);

        const { width: sw, height: sh } = Dimensions.get('screen');

        const collected: InfoGroup[] = [
          {
            title: 'Device Identity',
            icon: 'phone-portrait-outline',
            iconColor: '#4facfe',
            items: [
              { label: 'Device Name', value: deviceName },
              { label: 'Model', value: DeviceInfo.getModel() },
              { label: 'Brand', value: DeviceInfo.getBrand() },
              { label: 'Manufacturer', value: manufacturer },
              { label: 'Type', value: isTablet ? 'Tablet' : 'Phone' },
              { label: 'Emulator', value: isEmulator ? 'Yes' : 'No' },
            ],
          },
          {
            title: 'Operating System',
            icon: 'layers-outline',
            iconColor: '#a78bfa',
            items: [
              { label: 'OS', value: DeviceInfo.getSystemName() },
              { label: 'Version', value: DeviceInfo.getSystemVersion() },
              { label: 'Build ID', value: buildId || 'N/A' },
              ...(Platform.OS === 'android' ? [{ label: 'API Level', value: String(apiLevel) }] : []),
              { label: 'App Version', value: DeviceInfo.getReadableVersion() },
              { label: 'Bundle ID', value: DeviceInfo.getBundleId() },
            ],
          },
          {
            title: 'Memory & Storage',
            icon: 'server-outline',
            iconColor: '#38ef7d',
            items: [
              { label: 'Total RAM', value: formatBytes(totalMemory) },
              { label: 'Used RAM', value: formatBytes(usedMemory) },
              { label: 'Free RAM', value: formatBytes(totalMemory - usedMemory) },
              { label: 'Total Storage', value: formatBytes(totalDisk) },
              { label: 'Free Storage', value: formatBytes(freeDisk) },
              { label: 'Used Storage', value: formatBytes(totalDisk - freeDisk) },
            ],
          },
          {
            title: 'Display',
            icon: 'tv-outline',
            iconColor: '#ffd200',
            items: [
              { label: 'Screen Width', value: `${Math.round(sw)} px` },
              { label: 'Screen Height', value: `${Math.round(sh)} px` },
              { label: 'Window Width', value: `${Math.round(width)} px` },
              { label: 'Pixel Ratio', value: String(require('react-native').PixelRatio.get().toFixed(2)) },
              { label: 'Physical Res', value: `${Math.round(sw * require('react-native').PixelRatio.get())} × ${Math.round(sh * require('react-native').PixelRatio.get())}` },
            ],
          },
          {
            title: 'Battery & Power',
            icon: 'battery-half-outline',
            iconColor: '#f7971e',
            items: [
              { label: 'Battery Level', value: `${Math.round(batteryLevel * 100)}%` },
              { label: 'Charging', value: isCharging ? 'Yes' : 'No' },
              { label: 'Low RAM Device', value: DeviceInfo.isLowRamDevice() ? 'Yes' : 'No' },
            ],
          },
          {
            title: 'Network & Hardware',
            icon: 'wifi-outline',
            iconColor: '#ef473a',
            items: [
              { label: 'IP Address', value: ipAddress || 'N/A' },
              { label: 'Carrier', value: carrier || 'N/A' },
              { label: 'Camera', value: isCameraPresent ? 'Present' : 'Not Present' },
              { label: 'Device ID', value: DeviceInfo.getDeviceId() },
            ],
          },
        ];

        setGroups(collected);
        setResult('deviceInfo', {
          status: 'pass',
          details: `${DeviceInfo.getBrand()} ${DeviceInfo.getModel()} · ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}`,
          data: { model: DeviceInfo.getModel(), os: DeviceInfo.getSystemVersion() },
        });
      } catch (e) {
        setResult('deviceInfo', { status: 'warning', details: 'Some info unavailable' });
      } finally {
        setLoading(false);
      }
    };
    collect();
  }, []);

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Device Info"
          subtitle="Real-time device hardware & software details"
          step={2}
          onBack={() => navigation.goBack()}
          iconName="phone-portrait-outline"
        />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {loading ? (
            <GlassCard variant="strong" style={styles.loadingCard}>
              <View style={styles.loadingContent}>
                <LinearGradient
                  colors={['rgba(102,126,234,0.25)', 'rgba(118,75,162,0.15)']}
                  style={styles.loadingIcon}
                >
                  <Icon name="sync" size={40} color="#a78bfa" />
                </LinearGradient>
                <Text style={styles.loadingTitle}>Collecting Device Data</Text>
                <Text style={styles.loadingSub}>Reading hardware information...</Text>
              </View>
            </GlassCard>
          ) : (
            <>
              {/* Device badge */}
              <GlassCard variant="strong" style={styles.deviceBadge}>
                <View style={styles.deviceRow}>
                  <LinearGradient
                    colors={['rgba(102,126,234,0.2)', 'rgba(118,75,162,0.1)']}
                    style={styles.deviceIconBg}
                  >
                    <Icon
                      name={Platform.OS === 'ios' ? 'logo-apple' : 'logo-android'}
                      size={40}
                      color="#a78bfa"
                    />
                  </LinearGradient>
                  <View style={styles.deviceMeta}>
                    <Text style={styles.deviceModel}>{DeviceInfo.getBrand()} {DeviceInfo.getModel()}</Text>
                    <Text style={styles.deviceOs}>
                      {DeviceInfo.getSystemName()} {DeviceInfo.getSystemVersion()}
                    </Text>
                    <View style={styles.deviceBadgeRow}>
                      <View style={styles.chipBadge}>
                        <Icon name="checkmark-circle" size={12} color="#38ef7d" />
                        <Text style={styles.chipText}>Data Collected</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </GlassCard>

              {/* Info groups */}
              {groups.map((group, gi) => (
                <GlassCard key={gi} style={styles.groupCard}>
                  <View style={styles.groupHeader}>
                    <View style={[styles.groupIcon, { borderColor: group.iconColor + '44' }]}>
                      <Icon name={group.icon} size={18} color={group.iconColor} />
                    </View>
                    <Text style={styles.groupTitle}>{group.title}</Text>
                  </View>
                  {group.items.map((item, ii) => (
                    <View key={ii} style={[styles.infoRow, ii < group.items.length - 1 && styles.infoRowBorder]}>
                      <Text style={styles.infoLabel}>{item.label}</Text>
                      <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </GlassCard>
              ))}
            </>
          )}

          {!loading && (
            <GlassButton
              title="Next: Display Test"
              onPress={() => navigation.navigate('DisplayTest')}
              iconName="arrow-forward"
              size="lg"
              style={styles.nextBtn}
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
  loadingCard: { marginBottom: 20 },
  loadingContent: { alignItems: 'center', padding: 20, gap: 12 },
  loadingIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
  },
  loadingTitle: { color: TEXT.primary, fontSize: 20, fontWeight: '700' },
  loadingSub: { color: TEXT.muted, fontSize: 13 },
  deviceBadge: { marginBottom: 14 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  deviceIconBg: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
  },
  deviceMeta: { flex: 1, gap: 4 },
  deviceModel: { color: TEXT.primary, fontSize: 17, fontWeight: '800' },
  deviceOs: { color: TEXT.secondary, fontSize: 13 },
  deviceBadgeRow: { flexDirection: 'row', marginTop: 2 },
  chipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56,239,125,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { color: '#38ef7d', fontSize: 10, fontWeight: '700' },
  groupCard: { marginBottom: 12 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  groupIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: GLASS.backgroundStrong,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitle: { color: TEXT.primary, fontSize: 15, fontWeight: '700' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: GLASS.border,
  },
  infoLabel: { color: TEXT.muted, fontSize: 13, flex: 1 },
  infoValue: { color: TEXT.primary, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  nextBtn: { marginTop: 8 },
});

export default DeviceInfoScreen;
