import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { GLASS, TEXT } from '../theme/colors';
import GlassButton from './GlassButton';

const { width } = Dimensions.get('window');

interface GlassModalProps {
  visible: boolean;
  title: string;
  message?: string;
  iconName?: string;
  iconColor?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  confirmVariant?: 'primary' | 'secondary' | 'success' | 'danger' | 'glass';
  children?: React.ReactNode;
  showButtons?: boolean;
}

const GlassModal: React.FC<GlassModalProps> = ({
  visible,
  title,
  message,
  iconName,
  iconColor = '#a78bfa',
  confirmText = 'Allow',
  cancelText = 'Deny',
  onConfirm,
  onCancel,
  onClose,
  confirmVariant = 'primary',
  children,
  showButtons = true,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalWrapper}>
          <LinearGradient
            colors={['rgba(48, 43, 99, 0.98)', 'rgba(15, 12, 41, 1.0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          
          {/* Top border glow */}
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topGlow}
          />

          {onClose && (
            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Icon name="close" size={24} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}

          <View style={styles.content}>
            {/* Icon */}
            {iconName && (
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['rgba(167,139,250,0.2)', 'rgba(118,75,162,0.2)']}
                  style={styles.iconBg}
                >
                  <Icon name={iconName} size={40} color={iconColor} />
                </LinearGradient>
              </View>
            )}

            <Text style={styles.title}>{title}</Text>
            {message && <Text style={styles.message}>{message}</Text>}

            {children}

            {showButtons && (
              <View style={styles.actions}>
                {onCancel && (
                  <GlassButton
                    title={cancelText}
                    onPress={onCancel}
                    variant="glass"
                    style={styles.actionBtn}
                  />
                )}
                <GlassButton
                  title={confirmText}
                  onPress={onConfirm || (() => {})}
                  variant={confirmVariant}
                  style={onCancel ? styles.actionBtn : styles.fullWidth}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalWrapper: {
    width: width - 40,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: GLASS.borderStrong,
    overflow: 'hidden',
    shadowColor: '#764ba2',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
    backgroundColor: '#0F0C29',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 28,
    alignItems: 'center',
    width: '100%',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
  },
  title: {
    color: TEXT.primary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  message: {
    color: TEXT.secondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
  },
  fullWidth: {
    width: '100%',
  },
});

export default GlassModal;
