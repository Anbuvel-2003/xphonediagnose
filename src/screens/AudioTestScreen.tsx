import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
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
import { GRADIENTS, TEXT, GLASS, STATUS } from '../theme/colors';
import { useDiagnostic } from '../store/DiagnosticContext';

// Audio libraries
import Tts from 'react-native-tts';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AudioTest'>;
type CheckStatus = 'pending' | 'pass' | 'fail';

interface AudioCheck {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  digits: number;
}

const AUDIO_CHECKS: AudioCheck[] = [
  {
    id: 'speaker',
    title: 'Loudspeaker',
    description: 'Main speaker output quality',
    icon: 'volume-high-outline',
    iconColor: '#4facfe',
    digits: 4,
  },
  {
    id: 'earpiece',
    title: 'Earpiece',
    description: 'Top speaker for calls',
    icon: 'ear-outline',
    iconColor: '#a78bfa',
    digits: 3,
  },
  {
    id: 'microphone',
    title: 'Microphone',
    description: 'Voice recording quality',
    icon: 'mic-outline',
    iconColor: '#38ef7d',
    digits: 2,
  },
];

const audioRecorderPlayer = new AudioRecorderPlayer();

const AudioTestScreen = () => {
  const navigation = useNavigation<Nav>();
  const { setResult } = useDiagnostic();
  const [statuses, setStatuses] = useState<Record<string, CheckStatus>>({
    speaker: 'pending',
    earpiece: 'pending',
    microphone: 'pending',
  });

  const [testModal, setTestModal] = useState(false);
  const [currentCheck, setCurrentCheck] = useState<AudioCheck | null>(null);
  const [randomCode, setRandomCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordPath, setRecordPath] = useState('');
  const [isAudioTriggered, setIsAudioTriggered] = useState(false);
  const [isDoneTesting, setIsDoneTesting] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);

        if (
          grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Permissions granted');
        } else {
          console.log('All required permissions not granted');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  useEffect(() => {
    Tts.getInitStatus().then(() => {
      Tts.setDefaultLanguage('en-US');
      Tts.setDefaultRate(0.5);
    });
    requestPermissions();

    return () => {
      Tts.stop();
      audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
    };
  }, []);

  const generateCode = (len: number) => {
    let code = '';
    for (let i = 0; i < len; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  };

  const startTest = (check: AudioCheck) => {
    const code = generateCode(check.digits);
    setRandomCode(code);
    setUserInput('');
    setCurrentCheck(check);
    setTestModal(true);
    setIsDoneTesting(false);
    setIsAudioTriggered(false);
  };

  const handleAllowAudio = () => {
    setIsAudioTriggered(true);
    speakCode(randomCode);
  };

  const speakCode = (code: string) => {
    const digits = code.split('').join(' . '); // Add pause between digits
    Tts.speak(digits);
  };

  const handleVerify = () => {
    if (userInput === randomCode) {
      markStatus(currentCheck?.id || '', 'pass');
      setTestModal(false);
    } else {
      Alert.alert('Incorrect', 'The code you entered does not match. Try again?');
    }
  };

  const onStartRecord = async () => {
    const result = await audioRecorderPlayer.startRecorder();
    setIsRecording(true);
    setRecordPath(result);
  };

  const onStopRecord = async () => {
    await audioRecorderPlayer.stopRecorder();
    setIsRecording(false);
    setIsDoneTesting(true);
  };

  const onStartPlay = async () => {
    await audioRecorderPlayer.startPlayer(recordPath);
    audioRecorderPlayer.addPlayBackListener((e) => {
      if (e.currentPosition === e.duration) {
        audioRecorderPlayer.stopPlayer();
      }
    });
  };

  const markStatus = (id: string, status: CheckStatus) => {
    setStatuses(prev => ({ ...prev, [id]: status }));
  };

  const handleFinish = () => {
    const vals = Object.values(statuses);
    const passed = vals.filter(s => s === 'pass').length;
    const failed = vals.filter(s => s === 'fail').length;
    
    setResult('audio', {
      status: failed > 0 ? (failed >= 2 ? 'fail' : 'warning') : 'pass',
      score: Math.round((passed / 3) * 100),
      details: `${passed}/3 components working`,
    });
    navigation.navigate('CameraTest');
  };

  const testedCount = Object.values(statuses).filter(s => s !== 'pending').length;

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Audio Test"
          subtitle="Precision test for voice and audio"
          step={5}
          onBack={() => navigation.goBack()}
          iconName="volume-high-outline"
        />
        <View style={styles.content}>
          <GlassCard variant="strong" style={styles.visualCard}>
            <View style={styles.visualRow}>
              <View style={styles.visualIconWrapper}>
                <Icon name="musical-notes-outline" size={32} color={STATUS.running} />
              </View>
              <View style={styles.visualBars}>
                {[0.4, 0.7, 1.0, 0.8, 1.0, 0.7, 0.4].map((h, i) => (
                  <View key={i} style={[styles.bar, { height: 40 * h, backgroundColor: STATUS.running }]} />
                ))}
              </View>
            </View>
            <Text style={styles.visualText}>Verification codes will be played through speakers</Text>
          </GlassCard>

          {AUDIO_CHECKS.map(check => (
            <GlassCard key={check.id} style={styles.checkCard} padding={16}>
              <View style={styles.checkRow}>
                <View style={[styles.checkIcon, { borderColor: check.iconColor + '44' }]}>
                  <Icon name={check.icon} size={22} color={check.iconColor} />
                </View>
                <View style={styles.checkInfo}>
                  <Text style={styles.checkTitle}>{check.title}</Text>
                  <Text style={styles.checkDesc}>{check.description}</Text>
                </View>
                <View style={styles.checkActions}>
                  {statuses[check.id] === 'pending' ? (
                    <TouchableOpacity style={styles.testBtn} onPress={() => startTest(check)}>
                      <Text style={styles.testBtnText}>Start Verification</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.statusBox}>
                      <Icon 
                        name={statuses[check.id] === 'pass' ? 'checkmark-circle' : 'close-circle'} 
                        size={24} 
                        color={statuses[check.id] === 'pass' ? '#38ef7d' : '#ef473a'} 
                      />
                    </View>
                  )}
                </View>
              </View>
            </GlassCard>
          ))}

          <GlassButton
            title={testedCount < 3 ? `Verify All Components (${testedCount}/3)` : "Continue to Camera"}
            onPress={handleFinish}
            iconName="arrow-forward"
            size="lg"
            variant={testedCount === 3 ? 'success' : 'glass'}
            style={styles.continueBtn}
            disabled={testedCount < 2}
          />
        </View>
      </SafeAreaView>

      <GlassModal
        visible={testModal}
        title={currentCheck?.title || ''}
        message=""
        showButtons={false}
        onClose={() => setTestModal(false)}
      >
        <View style={styles.modalContent}>
          {currentCheck?.id === 'microphone' ? (
            <View style={styles.micTestContainer}>
              <Text style={styles.micGuide}>Read these numbers clearly:</Text>
              <Text style={styles.micDigits}>{randomCode}</Text>
              
              {!isDoneTesting ? (
                <TouchableOpacity 
                  style={[styles.recordBtn, isRecording && styles.recordBtnActive]} 
                  onPressIn={onStartRecord}
                  onPressOut={onStopRecord}
                >
                  <Icon name={isRecording ? 'mic' : 'mic-outline'} size={40} color="#fff" />
                  <Text style={styles.recordLabel}>{isRecording ? 'Recording...' : 'Hold to Record'}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.playbackContainer}>
                  <GlassButton 
                    title="Play Back" 
                    onPress={onStartPlay} 
                    iconName="play-outline" 
                    variant="glass" 
                    style={{ marginBottom: 12 }}
                  />
                  <View style={styles.resultRow}>
                    <GlassButton 
                      title="Done" 
                      onPress={() => { markStatus('microphone', 'pass'); setTestModal(false); }} 
                      variant="success" 
                      style={{ flex: 1 }} 
                    />
                    <GlassButton 
                      title="Fail" 
                      onPress={() => setTestModal(false)} 
                      variant="danger" 
                      style={{ flex: 1 }} 
                    />
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.speakerTestContainer}>
              {!isAudioTriggered ? (
                <View style={styles.allowContainer}>
                  <View style={styles.speakerVisualCircle}>
                    <Icon name={currentCheck?.icon || 'volume-high'} size={48} color={currentCheck?.iconColor} />
                  </View>
                  <Text style={styles.allowTitle}>Listen to the code</Text>
                  <Text style={styles.allowDesc}>Tap allow to hear the verification digits through the {currentCheck?.title.toLowerCase()}.</Text>
                  <GlassButton 
                    title="Allow & Play" 
                    onPress={handleAllowAudio} 
                    variant="primary" 
                    size="lg"
                  />
                </View>
              ) : (
                <>
                  <Text style={styles.speakerGuide}>Enter the code you heard:</Text>
                  <TextInput
                    style={styles.codeInput}
                    placeholder="XXXX"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    keyboardType="number-pad"
                    maxLength={currentCheck?.digits}
                    value={userInput}
                    onChangeText={setUserInput}
                    autoFocus
                  />
                  <TouchableOpacity style={styles.replayBtn} onPress={() => speakCode(randomCode)}>
                    <Icon name="refresh-outline" size={16} color={TEXT.accent} />
                    <Text style={styles.replayText}>Replay Audio</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.modalActionRow}>
                    <GlassButton title="Done" onPress={handleVerify} variant="primary" style={{ flex: 1 }} />
                    <GlassButton title="Fail" onPress={() => setTestModal(false)} variant="danger" style={{ flex: 1 }} />
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      </GlassModal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1, padding: 20 },
  visualCard: { marginBottom: 20 },
  visualRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  visualIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(79,172,254,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 40 },
  bar: { width: 6, borderRadius: 3 },
  visualText: { color: TEXT.secondary, fontSize: 13, textAlign: 'center' },
  checkCard: { marginBottom: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  checkIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: GLASS.backgroundStrong,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInfo: { flex: 1 },
  checkTitle: { color: TEXT.primary, fontSize: 16, fontWeight: '700' },
  checkDesc: { color: TEXT.muted, fontSize: 12, marginTop: 2 },
  checkActions: { minWidth: 100, alignItems: 'flex-end' },
  testBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  testBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statusBox: { paddingRight: 4 },
  continueBtn: { marginTop: 'auto' },
  modalContent: { paddingVertical: 10 },
  speakerTestContainer: { gap: 16 },
  speakerGuide: { color: TEXT.secondary, fontSize: 15, textAlign: 'center' },
  codeInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 10,
    paddingVertical: 12,
  },
  replayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  replayText: { color: TEXT.accent, fontSize: 14, fontWeight: '600' },
  modalActionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  micTestContainer: { alignItems: 'center', gap: 16 },
  micGuide: { color: TEXT.secondary, fontSize: 15 },
  micDigits: { color: '#fff', fontSize: 48, fontWeight: '900', letterSpacing: 8 },
  recordBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  recordBtnActive: {
    borderColor: '#ef473a',
    backgroundColor: 'rgba(239,71,58,0.2)',
  },
  recordLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
  playbackContainer: { width: '100%' },
  resultRow: { flexDirection: 'row', gap: 10 },
  allowContainer: { alignItems: 'center', paddingVertical: 10 },
  speakerVisualCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  allowTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  allowDesc: { color: TEXT.secondary, fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
});

export default AudioTestScreen;
