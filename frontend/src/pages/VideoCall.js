import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  ChevronLeft,
  Loader2,
  Phone
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function VideoCall() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callStarted, setCallStarted] = useState(false);
  const [callMode, setCallMode] = useState('video'); // 'video' or 'audio'
  const jitsiApiRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchAppointment();
    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointment(response.data);

      if (response.data.status !== 'confirmed') {
        toast.error('This appointment is not ready for a call');
        navigate(-1);
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      toast.error('Failed to load appointment');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const startCall = useCallback((mode) => {
    if (!appointment?.jitsi_room_id || !containerRef.current) return;
    setCallMode(mode);
    setCallStarted(true);

    // Small delay to let the container render
    setTimeout(() => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }

      const domain = 'meet.jit.si';
      const options = {
        roomName: appointment.jitsi_room_id,
        width: '100%',
        height: '100%',
        parentNode: containerRef.current,
        userInfo: {
          displayName: user?.full_name || 'User',
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: false,
          startWithVideoMuted: mode === 'audio',
          disableDeepLinking: true,
          startAudioOnly: mode === 'audio',
          disableModeratorIndicator: true,
          enableClosePage: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'hangup', 'chat',
            'fullscreen', 'settings', 'tileview', 'raisehand',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: '#111827',
          FILM_STRIP_MAX_HEIGHT: 120,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          MOBILE_APP_PROMO: false,
        },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);

      api.addListener('readyToClose', () => {
        navigate(`/appointments/${appointmentId}`);
      });

      jitsiApiRef.current = api;
    }, 100);
  }, [appointment, user, navigate, appointmentId]);

  const endCall = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('hangup');
    }
    navigate(`/appointments/${appointmentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg">Preparing your call...</p>
        </div>
      </div>
    );
  }

  const otherPerson = user?.role === 'patient' ? appointment?.doctor : appointment?.patient;

  // Pre-call lobby
  if (!callStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col" data-testid="video-call">
        {/* Header */}
        <div className="p-4 flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate(`/appointments/${appointmentId}`)}
            className="text-white gap-2 hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Center content */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm w-full">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-teal-700 mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-primary/30">
              <span className="text-5xl font-bold text-white">
                {otherPerson?.full_name?.charAt(0) || '?'}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">
              {user?.role === 'patient' ? `Dr. ${otherPerson?.full_name}` : otherPerson?.full_name}
            </h2>
            {appointment?.doctor?.specialties?.[0] && (
              <p className="text-gray-400 mb-6">{appointment.doctor.specialties[0]}</p>
            )}

            <div className="flex items-center justify-center gap-4 mb-8 text-sm text-gray-400">
              <span>📅 {appointment?.appointment_date}</span>
              <span>🕐 {appointment?.appointment_time}</span>
            </div>

            <p className="text-gray-500 text-sm mb-8">
              Ensure you're in a quiet place with a stable connection.
            </p>

            {/* Call buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => startCall('video')}
                className="w-full rounded-full h-14 text-base gap-3 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
                size="lg"
              >
                <VideoIcon className="w-5 h-5" />
                Start Video Call
              </Button>

              <Button
                onClick={() => startCall('audio')}
                variant="outline"
                className="w-full rounded-full h-14 text-base gap-3 border-gray-600 text-white hover:bg-white/10"
                size="lg"
              >
                <Phone className="w-5 h-5" />
                Audio Only
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // In-call view — Jitsi fills the entire screen, no duplicate controls
  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col" data-testid="video-call-active">
      {/* Mini header */}
      <div className="bg-gray-900/80 backdrop-blur px-4 py-2 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2 text-white text-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>{callMode === 'audio' ? 'Audio Call' : 'Video Call'}</span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={endCall}
          className="rounded-full gap-2"
        >
          <PhoneOff className="w-4 h-4" />
          End
        </Button>
      </div>

      {/* Jitsi fills all remaining space */}
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}
