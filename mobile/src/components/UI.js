import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOWS } from '../utils/constants';

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
}) => {
  const isDisabled = disabled || loading;
  
  const buttonStyles = [
    styles.button,
    styles[`button_${size}`],
    variant === 'outline' && styles.buttonOutline,
    variant === 'ghost' && styles.buttonGhost,
    isDisabled && styles.buttonDisabled,
    style,
  ];
  
  const textStyles = [
    styles.buttonText,
    styles[`buttonText_${size}`],
    variant === 'outline' && styles.buttonTextOutline,
    variant === 'ghost' && styles.buttonTextGhost,
    isDisabled && styles.buttonTextDisabled,
  ];

  const content = (
    <View style={styles.buttonContent}>
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? COLORS.surface : COLORS.primary} 
        />
      ) : (
        <>
          {icon && <View style={styles.buttonIcon}>{icon}</View>}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </View>
  );

  if (variant === 'primary' && !isDisabled) {
    return (
      <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.8}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[buttonStyles, styles.gradientButton]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {content}
    </TouchableOpacity>
  );
};

export const Card = ({ children, style, onPress, elevated = false }) => {
  const cardStyles = [
    styles.card,
    elevated && styles.cardElevated,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyles} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

export const Badge = ({ text, variant = 'default', size = 'sm' }) => {
  const badgeStyles = [
    styles.badge,
    styles[`badge_${variant}`],
    styles[`badge_${size}`],
  ];
  
  const textStyles = [
    styles.badgeText,
    styles[`badgeText_${variant}`],
    styles[`badgeText_${size}`],
  ];

  return (
    <View style={badgeStyles}>
      <Text style={textStyles}>{text}</Text>
    </View>
  );
};

export const Avatar = ({ source, name, size = 48, style }) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {source ? (
        <Image source={{ uri: source }} style={styles.avatarImage} />
      ) : (
        <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initials}</Text>
      )}
    </View>
  );
};

export const Divider = ({ style }) => (
  <View style={[styles.divider, style]} />
);

const styles = StyleSheet.create({
  // Button Styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    ...SHADOWS.md,
  },
  gradientButton: {
    backgroundColor: 'transparent',
  },
  button_sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  button_md: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  button_lg: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontWeight: '600',
    color: COLORS.surface,
    textAlign: 'center',
  },
  buttonText_sm: {
    fontSize: 14,
  },
  buttonText_md: {
    fontSize: 16,
  },
  buttonText_lg: {
    fontSize: 18,
  },
  buttonTextOutline: {
    color: COLORS.primary,
  },
  buttonTextGhost: {
    color: COLORS.primary,
  },
  buttonTextDisabled: {
    color: COLORS.textMuted,
  },

  // Card Styles
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardElevated: {
    borderWidth: 0,
    ...SHADOWS.lg,
  },

  // Badge Styles
  badge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badge_sm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badge_md: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badge_default: {
    backgroundColor: COLORS.border,
  },
  badge_primary: {
    backgroundColor: COLORS.primary + '20',
  },
  badge_success: {
    backgroundColor: COLORS.success + '20',
  },
  badge_warning: {
    backgroundColor: COLORS.warning + '20',
  },
  badge_error: {
    backgroundColor: COLORS.error + '20',
  },
  badge_info: {
    backgroundColor: COLORS.info + '20',
  },
  badgeText: {
    fontWeight: '600',
    fontSize: 12,
  },
  badgeText_sm: {
    fontSize: 10,
  },
  badgeText_md: {
    fontSize: 12,
  },
  badgeText_default: {
    color: COLORS.textSecondary,
  },
  badgeText_primary: {
    color: COLORS.primary,
  },
  badgeText_success: {
    color: COLORS.success,
  },
  badgeText_warning: {
    color: COLORS.warning,
  },
  badgeText_error: {
    color: COLORS.error,
  },
  badgeText_info: {
    color: COLORS.info,
  },

  // Avatar Styles
  avatar: {
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
});
