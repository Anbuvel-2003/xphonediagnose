import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { STATUS } from '../theme/colors';

type StatusType = 'pass' | 'fail' | 'warning' | 'pending' | 'running';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
}

const ICON_MAP: Record<StatusType, string> = {
  pass: 'checkmark-circle',
  fail: 'close-circle',
  warning: 'warning',
  pending: 'ellipse-outline',
  running: 'reload-circle',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'md' }) => {
  const color = STATUS[status];
  const iconSize = size === 'sm' ? 16 : 20;
  const fontSize = size === 'sm' ? 11 : 13;

  return (
    <View style={styles.container}>
      <Icon name={ICON_MAP[status]} size={iconSize} color={color} />
      {label && (
        <Text style={[styles.label, { color, fontSize }]}>{label}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default StatusBadge;
