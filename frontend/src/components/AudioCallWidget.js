import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Phone, PhoneOff, Mic, MicOff, Loader2, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';

const WS_URL = process.env.REACT_APP_BACKEND_URL?.replace('http', 'ws') || 'ws://localhost:8001';

export default function AudioCallWidget({ appointmentId, currentUserId }) {
    const [inCall, setInCall] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [status, setStatus] = useState('Idle'); // Idle, Calling, Ringing, Connected
    const [connecting, setConnecting] = useState(false);

    const wsRef = useRef(null);
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteAudioRef = useRef(null);

    useEffect(() => {
        // Initialize WebSocket on mount
        const ws = new WebSocket(`${WS_URL}/api/ws/audio/${appointmentId}`);

        ws.onopen = () => {
            console.log('Audio signaling connected');
        };

        ws.onmessage = async (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.sender === currentUserId) return;

                switch (message.type) {
                    case 'offer':
                        handleOffer(message.offer);
                        break;
                    case 'answer':
                        handleAnswer(message.answer);
                        break;
                    case 'ice-candidate':
                        handleIceCandidate(message.candidate);
                        break;
                    case 'end-call':
                        endCallLocally();
                        toast.info('The other party ended the call');
                        break;
                    default:
                        break;
                }
            } catch (err) {
                console.error('WebSocket receive error:', err);
            }
        };

        ws.onclose = () => {
            console.log('Audio signaling disconnected');
        };

        wsRef.current = ws;

        return () => {
            endCallLocally();
            ws.close();
        };
    }, [appointmentId, currentUserId]);

    const createPeerConnection = () => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'ice-candidate',
                    candidate: event.candidate,
                    sender: currentUserId
                }));
            }
        };

        pc.ontrack = (event) => {
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = event.streams[0];
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'connected') {
                setStatus('Connected');
                setConnecting(false);
            } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                endCallLocally();
            }
        };

        localStreamRef.current?.getTracks().forEach((track) => {
            pc.addTrack(track, localStreamRef.current);
        });

        return pc;
    };

    const startCall = async () => {
        try {
            setConnecting(true);
            setStatus('Calling');
            setInCall(true);

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;

            const pc = createPeerConnection();
            pcRef.current = pc;

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            wsRef.current?.send(JSON.stringify({
                type: 'offer',
                offer,
                sender: currentUserId
            }));
        } catch (error) {
            console.error('Error starting call:', error);
            toast.error('Could not access microphone');
            setConnecting(false);
            setInCall(false);
            setStatus('Idle');
        }
    };

    const handleOffer = async (offer) => {
        try {
            // Auto-accept the call as per UI flow
            setInCall(true);
            setStatus('Connecting...');

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;

            const pc = createPeerConnection();
            pcRef.current = pc;

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            wsRef.current?.send(JSON.stringify({
                type: 'answer',
                answer,
                sender: currentUserId
            }));
        } catch (error) {
            console.error('Error handling offer:', error);
            endCallLocally();
        }
    };

    const handleAnswer = async (answer) => {
        if (pcRef.current && pcRef.current.signalingState !== "stable") {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
    };

    const handleIceCandidate = async (candidate) => {
        if (pcRef.current) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
    };

    const endCallLocally = () => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        setInCall(false);
        setIsMuted(false);
        setConnecting(false);
        setStatus('Idle');
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }
    };

    const endCall = () => {
        wsRef.current?.send(JSON.stringify({ type: 'end-call', sender: currentUserId }));
        endCallLocally();
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    return (
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
            <audio ref={remoteAudioRef} autoPlay />

            <div className="flex-1">
                <div className="flex items-center gap-2">
                    {inCall && status === 'Connected' ? (
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    ) : inCall ? (
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    ) : (
                        <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">
                        {inCall ? status : 'Audio Channel Available'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {!inCall ? (
                    <Button
                        onClick={startCall}
                        size="sm"
                        className="gap-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                        disabled={connecting}
                    >
                        {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4" />}
                        Start Call
                    </Button>
                ) : (
                    <>
                        <Button
                            onClick={toggleMute}
                            variant={isMuted ? 'destructive' : 'secondary'}
                            size="icon"
                            className="rounded-full w-9 h-9"
                        >
                            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>

                        <Button
                            onClick={endCall}
                            variant="destructive"
                            size="icon"
                            className="rounded-full w-9 h-9"
                        >
                            <PhoneOff className="w-4 h-4" />
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
