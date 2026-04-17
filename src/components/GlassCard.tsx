import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { GLASS } from '../theme/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'strong' | 'subtle';
  gradient?: string[];
  padding?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
  gradient,
  padding = 16,
}) => {
  const bgGradient = gradient || (
    variant === 'strong'
      ? ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.06)']
      : variant === 'subtle'
      ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
      : ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)']
  );

  const borderColor =
    variant === 'strong'
      ? GLASS.borderStrong
      : variant === 'subtle'
      ? 'rgba(255,255,255,0.10)'
      : GLASS.border;

  return (
    <View style={[styles.wrapper, { borderColor }, style]}>
      <LinearGradient
        colors={bgGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.content, { padding }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  content: {
    width: '100%',
  },
});

export default GlassCard;
