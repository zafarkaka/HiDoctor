import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService } from '../../services/api';
import { Button } from '../../components/UI';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';

export default function VideoCallScreen({ route, navigation }) {
  const { appointmentId } = route.params;
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const webViewRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchAppointment();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const response = await appointmentService.getById(appointmentId);
      setAppointment(response.data);

      if (response.data.status !== 'confirmed') {
        Alert.alert(
          'Appointment Not Confirmed',
          'This appointment needs to be confirmed before starting a video call.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      Alert.alert('Error', 'Failed to load appointment');
    } finally {
      setLoading(false);
    }
  };

  const startCall = () => {
    setInCall(true);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const endCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setInCall(false);
    setCallDuration(0);
    Alert.alert(
      'Call Ended',
      'The video call has ended.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Preparing video call...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Appointment not found</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const roomId = appointment.jitsi_room_id || `clinic-connect-${appointmentId.slice(0, 8)}`;
  const jitsiUrl = `https://meet.jit.si/${roomId}#userInfo.displayName="${encodeURIComponent(user.full_name)}"&config.prejoinPageEnabled=false`;

  const otherPerson = user.role === 'patient' ? appointment.doctor : appointment.patient;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {!inCall ? (
        // Pre-call screen
        <View style={styles.preCallContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Video Call</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.preCallContent}>
            {/* Avatar */}
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {otherPerson?.full_name?.charAt(0) || '?'}
              </Text>
            </LinearGradient>

            <Text style={styles.calleeName}>
              {user.role === 'patient' ? `Dr. ${otherPerson?.full_name}` : otherPerson?.full_name}
            </Text>
            {user.role === 'patient' && appointment.doctor?.specialties?.[0] && (
              <Text style={styles.calleeSpecialty}>{appointment.doctor.specialties[0]}</Text>
            )}

            <View style={styles.callInfo}>
              <View style={styles.callInfoItem}>
                <Text style={styles.callInfoIcon}>📅</Text>
                <Text style={styles.callInfoText}>{appointment.appointment_date}</Text>
              </View>
              <View style={styles.callInfoItem}>
                <Text style={styles.callInfoIcon}>🕐</Text>
                <Text style={styles.callInfoText}>{appointment.appointment_time}</Text>
              </View>
            </View>

            <Text style={styles.callTip}>
              Make sure you're in a quiet place with good internet connection
            </Text>

            <Button
              title="📹 Start Video Call"
              onPress={startCall}
              style={styles.startButton}
              size="lg"
            />

            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => navigation.replace('Chat', { appointmentId })}
            >
              <Text style={styles.chatButtonText}>💬 Switch to Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // In-call screen with Jitsi
        <View style={styles.callContainer}>
          {/* Call Header */}
          <View style={styles.callHeader}>
            <View style={styles.callHeaderInfo}>
              <View style={styles.callStatusDot} />
              <Text style={styles.callStatusText}>In Call</Text>
              <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
            </View>
          </View>

          {/* Jitsi WebView */}
          <WebView
            ref={webViewRef}
            source={{ uri: jitsiUrl }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.webviewLoadingText}>Connecting...</Text>
              </View>
            )}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              Alert.alert('Connection Error', 'Failed to connect to video call. Please try again.');
              endCall();
            }}
          />

          {/* Call Controls */}
          <View style={styles.callControls}>
            <TouchableOpacity
              style={[styles.controlButton, styles.controlButtonMute]}
              onPress={() => Alert.alert('Mute', 'Use the Jitsi controls to mute/unmute')}
            >
              <Text style={styles.controlIcon}>🎤</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.controlButtonEnd]}
              onPress={endCall}
            >
              <Text style={styles.controlIcon}>📞</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.controlButtonCamera]}
              onPress={() => Alert.alert('Camera', 'Use the Jitsi controls to toggle camera')}
            >
              <Text style={styles.controlIcon}>📷</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  preCallContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  preCallContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.surface,
  },
  calleeName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  calleeSpecialty: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  callInfo: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  callInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  callInfoIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  callInfoText: {
    fontSize: 14,
    color: COLORS.text,
  },
  callTip: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  startButton: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  chatButton: {
    paddingVertical: SPACING.md,
  },
  chatButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  callContainer: {
    flex: 1,
    backgroundColor: '#1c1c1c',
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  callHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: SPACING.sm,
  },
  callStatusText: {
    fontSize: 14,
    color: COLORS.surface,
    marginRight: SPACING.md,
  },
  callDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
  webview: {
    flex: 1,
    backgroundColor: '#1c1c1c',
  },
  webviewLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1c1c',
  },
  webviewLoadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.surface,
  },
  callControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    backgroundColor: 'rgba(0,0,0,0.7)',
    gap: SPACING.lg,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonMute: {
    backgroundColor: '#333',
  },
  controlButtonCamera: {
    backgroundColor: '#333',
  },
  controlButtonEnd: {
    backgroundColor: COLORS.error,
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  controlIcon: {
    fontSize: 24,
  },
});
