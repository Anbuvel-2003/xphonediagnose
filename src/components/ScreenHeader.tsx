import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { TEXT, GLASS } from '../theme/colors';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  step?: number;
  totalSteps?: number;
  onBack?: () => void;
  iconName?: string;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  step,
  totalSteps = 14,
  onBack,
  iconName,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <View style={styles.backBtnInner}>
              <Icon name="chevron-back" size={22} color={TEXT.primary} />
            </View>
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          {iconName && (
            <Icon name={iconName} size={24} color="#a78bfa" style={styles.titleIcon} />
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        {step !== undefined && (
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>{step}/{totalSteps}</Text>
          </View>
        )}
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {step !== undefined && (
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    marginRight: 12,
  },
  backBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: GLASS.backgroundStrong,
    borderWidth: 1,
    borderColor: GLASS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    color: TEXT.primary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  stepBadge: {
    backgroundColor: GLASS.backgroundStrong,
    borderWidth: 1,
    borderColor: GLASS.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepText: {
    color: TEXT.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    color: TEXT.secondary,
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  progressTrack: {
    height: 3,
    backgroundColor: GLASS.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default ScreenHeader;
