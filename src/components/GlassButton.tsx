import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { GLASS, TEXT, GRADIENTS } from '../theme/colors';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  iconName?: string;
  iconSize?: number;
  gradient?: string[];
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
}

const VARIANT_GRADIENTS: Record<string, string[]> = {
  primary: GRADIENTS.button,
  secondary: GRADIENTS.buttonSecondary,
  success: GRADIENTS.success,
  danger: GRADIENTS.error,
  glass: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
};

const SIZE_STYLES: Record<string, { paddingVertical: number; paddingHorizontal: number; borderRadius: number; fontSize: number }> = {
  sm: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, fontSize: 13 },
  md: { paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14, fontSize: 15 },
  lg: { paddingVertical: 18, paddingHorizontal: 24, borderRadius: 18, fontSize: 17 },
};

const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  iconName,
  iconSize = 20,
  gradient,
  style,
  textStyle,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
}) => {
  const gradientColors = gradient || VARIANT_GRADIENTS[variant];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[styles.wrapper, style, disabled && styles.disabled]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.content,
          {
            paddingVertical: sizeStyle.paddingVertical,
            paddingHorizontal: sizeStyle.paddingHorizontal,
            borderRadius: sizeStyle.borderRadius,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
        ) : iconName ? (
          <Icon name={iconName} size={iconSize} color="#fff" style={styles.icon} />
        ) : null}
        <Text
          style={[styles.text, { fontSize: sizeStyle.fontSize }, textStyle]}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderColor: GLASS.borderStrong,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: TEXT.primary,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    flexShrink: 1,
  },
  disabled: {
    opacity: 0.45,
  },
});

export default GlassButton;
