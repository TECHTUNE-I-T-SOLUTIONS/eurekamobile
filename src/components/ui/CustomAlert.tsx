import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Sparkles,
  Crown,
  HelpCircle,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive' | 'primary';
}

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  type?: 'success' | 'warning' | 'error' | 'info' | 'upgrade' | 'confirm';
  buttons?: AlertButton[];
  onClose?: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  buttons = [{ text: 'OK', style: 'primary' }],
  onClose,
}) => {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={32} color="#10B981" />,
          bgColor: '#10B98118',
          borderColor: '#10B98140',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={32} color="#F59E0B" />,
          bgColor: '#F59E0B18',
          borderColor: '#F59E0B40',
        };
      case 'upgrade':
        return {
          icon: <Crown size={32} color="#F59E0B" />,
          bgColor: '#F59E0B20',
          borderColor: '#F59E0B60',
        };
      case 'error':
        return {
          icon: <XCircle size={32} color="#EF4444" />,
          bgColor: '#EF444418',
          borderColor: '#EF444440',
        };
      case 'confirm':
        return {
          icon: <HelpCircle size={32} color={theme.colors.secondary} />,
          bgColor: `${theme.colors.secondary}18`,
          borderColor: `${theme.colors.secondary}40`,
        };
      case 'info':
      default:
        return {
          icon: <Sparkles size={32} color={theme.colors.primary} />,
          bgColor: `${theme.colors.primary}18`,
          borderColor: `${theme.colors.primary}40`,
        };
    }
  };

  const iconConfig = getIconConfig();

  const handleButtonPress = (btn: AlertButton) => {
    if (btn.onPress) {
      btn.onPress();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.surfaceBorder,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Top Decorative Icon */}
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: iconConfig.bgColor,
                borderColor: iconConfig.borderColor,
              },
            ]}
          >
            {iconConfig.icon}
          </View>

          {/* Title */}
          <Text
            style={[
              theme.typography.h2,
              styles.title,
              { color: theme.colors.textPrimary },
            ]}
          >
            {title}
          </Text>

          {/* Message */}
          {message ? (
            <Text
              style={[
                theme.typography.body,
                styles.message,
                { color: theme.colors.textSecondary },
              ]}
            >
              {message}
            </Text>
          ) : null}

          {/* Buttons */}
          <View
            style={[
              styles.buttonsContainer,
              buttons.length > 2
                ? styles.buttonsColumn
                : buttons.length === 1
                ? styles.buttonsSingle
                : styles.buttonsRow,
            ]}
          >
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              const isPrimary = btn.style === 'primary' || (!isCancel && !isDestructive && index === buttons.length - 1);

              let btnBg = theme.colors.surfaceVariant;
              let textColor = theme.colors.textPrimary;
              let btnBorder = theme.colors.surfaceBorder;

              if (isDestructive) {
                btnBg = '#EF4444';
                textColor = '#FFFFFF';
                btnBorder = '#EF4444';
              } else if (isPrimary) {
                btnBg = theme.colors.primary;
                textColor = theme.colors.primaryForeground;
                btnBorder = theme.colors.primary;
              }

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleButtonPress(btn)}
                  activeOpacity={0.8}
                  style={[
                    styles.button,
                    {
                      backgroundColor: btnBg,
                      borderColor: btnBorder,
                    },
                    buttons.length === 1
                      ? styles.buttonSingle
                      : buttons.length === 2
                      ? { flex: 1 }
                      : { width: '100%' },
                  ]}
                >
                  <Text style={[styles.buttonText, { color: textColor }]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: Math.min(width - 48, 380),
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
    marginTop: 6,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  buttonsSingle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonsColumn: {
    flexDirection: 'column',
    width: '100%',
  },
  button: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonSingle: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
