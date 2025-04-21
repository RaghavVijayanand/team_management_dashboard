import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Alert,
} from '@mui/material';
import {
  CallEnd as CallEndIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
} from '@mui/icons-material';

interface VoiceCallProps {
  isOpen: boolean;
  onClose: () => void;
  remoteUserId: string;
  localUserId: string;
  onCallEnd: () => void; // Keep this callback
}

const VoiceCall: React.FC<VoiceCallProps> = ({
  isOpen,
  onClose,
  remoteUserId,
  localUserId,
  onCallEnd,
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null); // Keep for remote audio
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const remoteAudioRef = useRef<HTMLAudioElement>(null); // Ref for remote audio element
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isCleaningUpRef = useRef<boolean>(false);

  // Function to stop media tracks
  const stopMediaTracks = (stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        if (track.readyState === 'live') {
          console.log(`[VoiceCall] Stopping track: ${track.kind}, ID: ${track.id}`);
          track.stop();
        }
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      console.log('[VoiceCall] Setting up...');
      isCleaningUpRef.current = false;

      // Connect WebSocket
      const connectWebSocket = () => {
        if (isCleaningUpRef.current || !isOpen) return;
        try {
          const ws = new WebSocket(`ws://localhost:8080?userId=${localUserId}`);
          wsRef.current = ws;

          ws.onopen = () => console.log('[VoiceCall] Connected to signaling server');
          ws.onerror = (error) => console.error('[VoiceCall] WebSocket error:', error);
          ws.onclose = () => {
            console.log('[VoiceCall] WebSocket connection closed');
            if (isOpen && wsRef.current === ws && !isCleaningUpRef.current) {
              setTimeout(connectWebSocket, 3000); // Reconnect logic
            }
          };

          ws.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.from === remoteUserId && peerConnectionRef.current) {
              try {
                switch (message.type) {
                  case 'offer':
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.data));
                    const answer = await peerConnectionRef.current.createAnswer();
                    await peerConnectionRef.current.setLocalDescription(answer);
                    ws.send(JSON.stringify({ type: 'answer', target: remoteUserId, from: localUserId, data: answer }));
                    break;
                  case 'answer':
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.data));
                    break;
                  case 'ice-candidate':
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(message.data));
                    break;
                }
              } catch (err) {
                console.error('[VoiceCall] Error handling signaling message:', err);
                setError('Connection failed.');
              }
            }
          };
        } catch (err) {
          console.error('[VoiceCall] WebSocket connection error:', err);
          if (isOpen) setTimeout(connectWebSocket, 3000);
        }
      };
      connectWebSocket();

      // Get local audio stream only
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false }) // Request only audio
        .then((stream) => {
          setLocalStream(stream);
          setIsConnecting(false); // Assume connection starts once we have audio

          // Initialize peer connection
          const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
          const peerConnection = new RTCPeerConnection(configuration);
          peerConnectionRef.current = peerConnection;

          // Add local audio track
          stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
          });

          // Handle ICE candidates
          peerConnection.onicecandidate = (event) => {
            if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'ice-candidate', target: remoteUserId, from: localUserId, data: event.candidate }));
            }
          };

          // Handle remote audio track
          peerConnection.ontrack = (event) => {
             console.log('[VoiceCall] Remote track received:', event.track.kind);
             if (event.track.kind === 'audio' && remoteAudioRef.current) {
               if (remoteAudioRef.current.srcObject !== event.streams[0]) {
                 setRemoteStream(event.streams[0]);
                 remoteAudioRef.current.srcObject = event.streams[0];
                 remoteAudioRef.current.play().catch(e => console.error("Error playing remote audio:", e));
                 console.log('[VoiceCall] Attached remote audio stream.');
               }
             }
          };

          // Create and send offer
          peerConnection.createOffer()
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'offer', target: remoteUserId, from: localUserId, data: peerConnection.localDescription }));
              } else {
                throw new Error('WebSocket not connected');
              }
            })
            .catch(err => {
              console.error('[VoiceCall] Error creating offer:', err);
              setError('Failed to initiate call.');
            });
        })
        .catch((err) => {
          console.error('[VoiceCall] Error accessing microphone:', err);
          setError('Failed to access microphone.');
          setIsConnecting(false);
        });
    }

    // Cleanup function
    return () => {
      console.log('[VoiceCall] Cleanup running...');
      if (isCleaningUpRef.current) return; // Prevent double cleanup
      isCleaningUpRef.current = true;

      // Stop tracks
      stopMediaTracks(localStream);
      stopMediaTracks(remoteStream);

      // Close PeerConnection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
        console.log('[VoiceCall] PeerConnection closed.');
      }

      // Close WebSocket
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
        console.log('[VoiceCall] WebSocket closed.');
      }
      
      // Detach remote audio
      if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = null;
      }

      // Reset state (use timeout to ensure cleanup completes)
      setTimeout(() => {
        console.log('[VoiceCall] Resetting state...');
        setLocalStream(null);
        setRemoteStream(null);
        setIsConnecting(true);
        setError(null);
        setIsMuted(false);
        // isCleaningUpRef.current = false; // Reset flag after state updates
      }, 0);
    };
  }, [isOpen, localUserId, remoteUserId]); // Dependencies

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const handleEndCallInternal = () => {
    console.log('[VoiceCall] handleEndCallInternal called.');
    onCallEnd(); // Call the parent's handler
    // Cleanup is handled by the useEffect return function when isOpen changes
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2, alignItems: 'center', justifyContent: 'center' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
          {error}
        </Alert>
      )}

      <Typography variant="h6" gutterBottom>
        Voice Call with {remoteUserId}
      </Typography>

      {isConnecting && !error && (
        <Typography color="text.secondary">Connecting...</Typography>
      )}

      {/* Hidden audio element for remote stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
        <IconButton
          size="large"
          onClick={toggleMute}
          color={isMuted ? 'error' : 'primary'}
          disabled={!localStream || !!error}
          sx={{ border: 1, borderColor: 'divider' }}
        >
          {isMuted ? <MicOffIcon /> : <MicIcon />}
        </IconButton>
        <IconButton
          size="large"
          onClick={handleEndCallInternal}
          color="error"
          sx={{ border: 1, borderColor: 'divider' }}
        >
          <CallEndIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default VoiceCall;
