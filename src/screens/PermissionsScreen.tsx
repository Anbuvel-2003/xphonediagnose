import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  PermissionsAndroid,
  Linking,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import BleManager from 'react-native-ble-manager';
import Geolocation from 'react-native-geolocation-service';
import { RootStackParamList } from '../navigation/types';
import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';
import GlassModal from '../components/GlassModal';
import ScreenHeader from '../components/ScreenHeader';
import StatusBadge from '../components/StatusBadge';
import { GRADIENTS, TEXT, GLASS, STATUS } from '../theme/colors';
import { useDiagnostic } from '../store/DiagnosticContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Permissions'>;
type PermStatus = 'pending' | 'granted' | 'denied' | 'disabled';

interface PermissionItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  androidPermission?: string;
  required: boolean;
}

const PERMISSIONS: PermissionItem[] = [
  {
    id: 'camera',
    title: 'Camera',
    description: 'Required to test front and rear cameras',
    icon: 'camera-outline',
    iconColor: '#4facfe',
    androidPermission: PermissionsAndroid.PERMISSIONS.CAMERA,
    required: true,
  },
  {
    id: 'microphone',
    title: 'Microphone',
    description: 'Required to test audio recording',
    icon: 'mic-outline',
    iconColor: '#f7971e',
    androidPermission: PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    required: true,
  },
  {
    id: 'location',
    title: 'Location Settings',
    description: 'Required to test GPS and Scan WiFi',
    icon: 'location-outline',
    iconColor: '#38ef7d',
    androidPermission: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    required: true,
  },
  {
    id: 'storage',
    title: 'Storage',
    description: 'Required to test read/write performance',
    icon: 'folder-outline',
    iconColor: '#a78bfa',
    androidPermission:
      Number(Platform.Version) >= 33
        ? undefined
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    required: true,
  },
  {
    id: 'sensors',
    title: 'Body Sensors',
    description: 'Required to test device sensors',
    icon: 'compass-outline',
    iconColor: '#ef473a',
    androidPermission: PermissionsAndroid.PERMISSIONS.BODY_SENSORS,
    required: true,
  },
  {
    id: 'connectivity',
    title: 'Nearby Devices (BT)',
    description: 'Bluetooth must be ON for diagnostic tests',
    icon: 'bluetooth-outline',
    iconColor: '#4facfe',
    androidPermission: 
      Number(Platform.Version) >= 31 
        ? (PermissionsAndroid.PERMISSIONS as any).BLUETOOTH_CONNECT 
        : PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    required: true,
  },
];

const PermissionsScreen = () => {
  const navigation = useNavigation<Nav>();
  const { setResult } = useDiagnostic();
  const [statuses, setStatuses] = useState<Record<string, PermStatus>>(
    Object.fromEntries(PERMISSIONS.map(p => [p.id, 'pending'])),
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPermission, setCurrentPermission] = useState<PermissionItem | null>(null);

  useEffect(() => {
    BleManager.start({ showAlert: false });
    const timer = setInterval(checkHardwareStatus, 3000);
    checkHardwareStatus();
    return () => clearInterval(timer);
  }, []);

  const checkHardwareStatus = async () => {
    if (Platform.OS === 'android') {
      try {
        await BleManager.checkState();
      } catch (e) {
        console.log('Hardware check error', e);
      }
    }
  };

  const showPermissionModal = (perm: PermissionItem) => {
    setCurrentPermission(perm);
    setModalVisible(true);
  };

  const requestPermission = async (perm: PermissionItem) => {
    setModalVisible(false);
    try {
      if (Platform.OS === 'android' && perm.androidPermission) {
        const result = await PermissionsAndroid.request(perm.androidPermission as any);
        
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          if (perm.id === 'location') {
            setStatuses(prev => ({ ...prev, [perm.id]: 'granted' }));
            // Trigger native "Turn on Location?" system dialog
            Geolocation.getCurrentPosition(
              () => {},
              (error) => {
                if (error.code === 2) {
                   Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
                }
              },
              { enableHighAccuracy: true, timeout: 1000, maximumAge: 0 }
            );
            // Trigger WiFi settings panel
            if (Number(Platform.Version) >= 29) {
               Linking.sendIntent('android.settings.panel.action.WIFI');
            }
          } else if (perm.id === 'connectivity') {
            try {
              await BleManager.enableBluetooth();
              setStatuses(prev => ({ ...prev, [perm.id]: 'granted' }));
            } catch {
              setStatuses(prev => ({ ...prev, [perm.id]: 'disabled' }));
              Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
            }
          } else {
            setStatuses(prev => ({ ...prev, [perm.id]: 'granted' }));
          }
        } else {
          setStatuses(prev => ({ ...prev, [perm.id]: 'pending' }));
        }
      } else {
        setStatuses(prev => ({ ...prev, [perm.id]: 'granted' }));
      }
    } catch (e) {
      console.log('Permission error', e);
      setStatuses(prev => ({ ...prev, [perm.id]: 'pending' }));
    }
  };

  const proceedToNext = () => {
    const allReady = PERMISSIONS.every(p => statuses[p.id] === 'granted');
    if (!allReady) {
      Alert.alert('Incomplete', 'Please grant all permissions and enable hardware to continue.');
      return;
    }

    setResult('permissions', {
      status: 'pass',
      details: `${PERMISSIONS.length}/${PERMISSIONS.length} ready`,
    });
    navigation.navigate('DeviceInfo');
  };

  const getStatusBadge = (status: PermStatus) => {
    if (status === 'granted') return { status: 'pass' as const, label: 'Ready' };
    if (status === 'disabled') return { status: 'fail' as const, label: 'BT Required' };
    return { status: 'pending' as const, label: 'Action Required' };
  };

  const readyCount = Object.values(statuses).filter(s => s === 'granted').length;

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Setup & Permissions"
          subtitle="Compulsory hardware & permission check"
          step={1}
          onBack={() => navigation.goBack()}
          iconName="shield-checkmark-outline"
        />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <GlassCard variant="strong" style={styles.progressCard} padding={12}>
            <View style={styles.progressRow}>
              <Icon name="hardware-chip-outline" size={24} color={STATUS.pass} />
              <View style={styles.progressInfo}>
                <Text style={styles.progressValue}>{readyCount}/{PERMISSIONS.length} Hardware/Perms Ready</Text>
              </View>
            </View>
          </GlassCard>

          {PERMISSIONS.map(perm => {
            const status = statuses[perm.id];
            const badge = getStatusBadge(status);
            return (
              <GlassCard key={perm.id} style={styles.permCard} padding={12}>
                <View style={styles.permRow}>
                  <View style={[styles.permIcon, { borderColor: perm.iconColor + '44' }]}>
                    <Icon name={perm.icon} size={20} color={perm.iconColor} />
                  </View>
                  <View style={styles.permInfo}>
                    <View style={styles.permTitleRow}>
                      <Text style={styles.permTitle}>{perm.title}</Text>
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>Compulsory</Text>
                      </View>
                    </View>
                    <Text style={styles.permDesc}>{perm.description}</Text>
                  </View>
                  <View style={styles.permStatus}>
                    {status !== 'granted' ? (
                      <GlassButton
                        title={status === 'disabled' ? 'Enable' : 'Allow'}
                        onPress={() => showPermissionModal(perm)}
                        variant={status === 'disabled' ? 'primary' : 'glass'}
                        size="sm"
                      />
                    ) : (
                      <StatusBadge status={badge.status} label={badge.label} size="sm" />
                    )}
                  </View>
                </View>
              </GlassCard>
            );
          })}

          <GlassButton
            title="Continue Diagnosis"
            onPress={proceedToNext}
            iconName="arrow-forward"
            size="lg"
            variant={readyCount === PERMISSIONS.length ? 'primary' : 'glass'}
            disabled={readyCount < PERMISSIONS.length}
            style={styles.continueBtn}
          />
        </ScrollView>
      </SafeAreaView>

      {currentPermission && (
        <GlassModal
          visible={modalVisible}
          title={statuses[currentPermission.id] === 'disabled' ? `Turn ON ${currentPermission.title}` : `Allow ${currentPermission.title}`}
          message={statuses[currentPermission.id] === 'disabled' 
            ? `Please turn on your ${currentPermission.title.split(' ')[0]} hardware to proceed with the diagnostic test.`
            : `XPhone Diagnose needs ${currentPermission.title.toLowerCase()} access to run the ${currentPermission.title.toLowerCase()} diagnostic test.`
          }
          iconName={currentPermission.icon}
          iconColor={currentPermission.iconColor}
          confirmText={statuses[currentPermission.id] === 'disabled' ? 'Turn ON' : 'Allow Access'}
          cancelText="Cancel"
          onConfirm={() => requestPermission(currentPermission)}
          onCancel={() => setModalVisible(false)}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  progressCard: { marginBottom: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressInfo: { flex: 1 },
  progressValue: { color: TEXT.primary, fontSize: 16, fontWeight: '800' },
  permCard: { marginBottom: 8 },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  permIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: GLASS.backgroundStrong,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permInfo: { flex: 1 },
  permTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  permTitle: { color: TEXT.primary, fontSize: 14, fontWeight: '700' },
  requiredBadge: {
    backgroundColor: 'rgba(102,126,234,0.25)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  requiredText: { color: '#a78bfa', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  permDesc: { color: TEXT.muted, fontSize: 11, lineHeight: 15 },
  permStatus: { alignItems: 'flex-end', marginLeft: 4 },
  continueBtn: { marginTop: 20 },
});

export default PermissionsScreen;
