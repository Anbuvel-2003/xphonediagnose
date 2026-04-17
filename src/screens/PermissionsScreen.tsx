import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  PermissionsAndroid,
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
import StatusBadge from '../components/StatusBadge';
import { GRADIENTS, TEXT, GLASS, STATUS } from '../theme/colors';
import { useDiagnostic } from '../store/DiagnosticContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Permissions'>;
type PermStatus = 'pending' | 'granted' | 'denied';

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
    title: 'Location',
    description: 'Required to test GPS and connectivity',
    icon: 'location-outline',
    iconColor: '#38ef7d',
    androidPermission: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    required: false,
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
    required: false,
  },
  {
    id: 'sensors',
    title: 'Body Sensors',
    description: 'Required to test device sensors',
    icon: 'compass-outline',
    iconColor: '#ef473a',
    androidPermission: PermissionsAndroid.PERMISSIONS.BODY_SENSORS,
    required: false,
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
  const showPermissionModal = (perm: PermissionItem) => {
    setCurrentPermission(perm);
    setModalVisible(true);
  };

  const requestPermission = async (perm: PermissionItem) => {
    setModalVisible(false);
    try {
      if (Platform.OS === 'android' && perm.androidPermission) {
        const result = await PermissionsAndroid.request(perm.androidPermission as any, {
          title: `${perm.title} Permission`,
          message: perm.description,
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        });
        setStatuses(prev => ({
          ...prev,
          [perm.id]: result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'pending',
        }));
      } else {
        setStatuses(prev => ({ ...prev, [perm.id]: 'granted' }));
      }
    } catch {
      setStatuses(prev => ({ ...prev, [perm.id]: 'pending' }));
    }
  };

  const proceedToNext = () => {
    const allGranted = PERMISSIONS.filter(p => p.required).every(
      p => statuses[p.id] === 'granted',
    );
    setResult('permissions', {
      status: allGranted ? 'pass' : 'warning',
      details: `${Object.values(statuses).filter(s => s === 'granted').length}/${PERMISSIONS.length} granted`,
    });
    navigation.navigate('DeviceInfo');
  };

  const getStatusBadge = (status: PermStatus) => {
    if (status === 'granted') return { status: 'pass' as const, label: 'Granted' };
    if (status === 'denied') return { status: 'fail' as const, label: 'Denied' };
    return { status: 'pending' as const, label: 'Pending' };
  };

  const grantedCount = Object.values(statuses).filter(s => s === 'granted').length;

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Permissions"
          subtitle="Grant access to run all diagnostic tests"
          step={1}
          onBack={() => navigation.goBack()}
          iconName="shield-checkmark-outline"
        />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Progress indicator */}
          <GlassCard variant="strong" style={styles.progressCard} padding={12}>
            <View style={styles.progressRow}>
              <Icon name="checkmark-circle" size={24} color={STATUS.pass} />
              <View style={styles.progressInfo}>
                <Text style={styles.progressValue}>{grantedCount}/{PERMISSIONS.length}</Text>
              </View>
            </View>
          </GlassCard>

          {/* Permission items */}
          {PERMISSIONS.map(perm => {
            const badge = getStatusBadge(statuses[perm.id]);
            return (
              <GlassCard key={perm.id} style={styles.permCard} padding={12}>
                <View style={styles.permRow}>
                  <View style={[styles.permIcon, { borderColor: perm.iconColor + '44' }]}>
                    <Icon name={perm.icon} size={20} color={perm.iconColor} />
                  </View>
                  <View style={styles.permInfo}>
                    <View style={styles.permTitleRow}>
                      <Text style={styles.permTitle}>{perm.title}</Text>
                      {perm.required && (
                        <View style={styles.requiredBadge}>
                          <Text style={styles.requiredText}>Required</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.permDesc}>{perm.description}</Text>
                  </View>
                  <View style={styles.permStatus}>
                    {statuses[perm.id] === 'pending' ? (
                      <GlassButton
                        title="Allow"
                        onPress={() => showPermissionModal(perm)}
                        variant="glass"
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
            title="Continue"
            onPress={proceedToNext}
            iconName="arrow-forward"
            size="lg"
            variant={grantedCount === PERMISSIONS.length ? 'primary' : 'glass'}
            disabled={grantedCount < PERMISSIONS.length}
            style={styles.continueBtn}
          />
        </ScrollView>
      </SafeAreaView>

      {currentPermission && (
        <GlassModal
          visible={modalVisible}
          title={`Allow ${currentPermission.title} Access`}
          message={`XPhone Diagnose needs ${currentPermission.title.toLowerCase()} access to run the ${currentPermission.title.toLowerCase()} diagnostic test.\n\n${currentPermission.description}`}
          iconName={currentPermission.icon}
          iconColor={currentPermission.iconColor}
          confirmText="Allow"
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
  progressValue: { color: TEXT.primary, fontSize: 20, fontWeight: '800' },
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
