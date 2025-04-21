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
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
} from '@mui/icons-material';

interface VideoCallProps {
  isOpen: boolean;
  onClose: () => void;
  remoteUserId: string;
  localUserId: string;
  onCallEnd: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({
  isOpen,
  onClose,
  remoteUserId,
  localUserId,
  onCallEnd,
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isCleaningUpRef = useRef<boolean>(false);

  // Track stopping is now handled directly in cleanup functions

  // Handle call end - ensure all resources are properly released
  const handleEndCall = () => {
    console.log('[VideoCall] Ending call - Starting thorough cleanup...');
    isCleaningUpRef.current = true;

    // 1. First stop all media tracks to immediately release camera/mic
    if (localStream) {
      console.log('[VideoCall] Stopping local media tracks:');
      localStream.getTracks().forEach(track => {
        const trackType = track.kind;
        const trackId = track.id;
        const trackState = track.readyState;

        try {
          track.stop();
          console.log(`[VideoCall] Successfully stopped ${trackType} track ${trackId} (was ${trackState})`);
        } catch (err) {
          console.error(`[VideoCall] Error stopping ${trackType} track:`, err);
        }
      });
    } else {
      console.log('[VideoCall] No local stream to clean up');
    }

    if (remoteStream) {
      console.log('[VideoCall] Stopping remote media tracks:');
      remoteStream.getTracks().forEach(track => {
        try {
          track.stop();
          console.log(`[VideoCall] Stopped remote ${track.kind} track: ${track.id}`);
        } catch (err) {
          console.error('[VideoCall] Error stopping remote track:', err);
        }
      });
    }

    // 2. Clear video elements to prevent memory leaks
    if (localVideoRef.current) {
      console.log('[VideoCall] Clearing local video element');
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      console.log('[VideoCall] Clearing remote video element');
      remoteVideoRef.current.srcObject = null;
    }

    // 3. Close peer connection
    if (peerConnectionRef.current) {
      try {
        // Remove all tracks from peer connection
        const senders = peerConnectionRef.current.getSenders();
        console.log(`[VideoCall] Removing ${senders.length} senders from peer connection`);

        senders.forEach(sender => {
          if (sender.track) {
            try {
              sender.track.stop(); // Stop any remaining tracks
              console.log(`[VideoCall] Stopped track in sender: ${sender.track.kind}`);
            } catch (err) {
              console.error('[VideoCall] Error stopping sender track:', err);
            }
          }

          try {
            peerConnectionRef.current?.removeTrack(sender);
          } catch (err) {
            console.error('[VideoCall] Error removing track from peer connection:', err);
          }
        });

        // Close the connection
        peerConnectionRef.current.close();
        console.log('[VideoCall] Peer connection closed');
      } catch (e) {
        console.error('[VideoCall] Error closing peer connection:', e);
      } finally {
        peerConnectionRef.current = null;
      }
    }

    // 4. Close WebSocket
    if (wsRef.current) {
      try {
        wsRef.current.onclose = null; // Remove event handlers
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
        console.log('[VideoCall] WebSocket connection closed');
      } catch (err) {
        console.error('[VideoCall] Error closing WebSocket:', err);
      } finally {
        wsRef.current = null;
      }
    }

    // 5. Reset state
    console.log('[VideoCall] Resetting component state');
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnecting(true);
    setError(null);
    setIsMuted(false);
    setIsVideoOff(false);

    // 6. Call the callbacks
    console.log('[VideoCall] Calling onCallEnd and onClose callbacks');
    onCallEnd();
    onClose(); // Call the onClose prop to notify parent component

    console.log('[VideoCall] Call ended - all resources released');
  };

  useEffect(() => {
    if (isOpen) {
      console.log('Setting up video call...');
      isCleaningUpRef.current = false;

      // Connect to signaling server
      const connectWebSocket = () => {
        if (isCleaningUpRef.current || !isOpen) return;

        try {
          const ws = new WebSocket(`ws://localhost:8080?userId=${localUserId}`);
          wsRef.current = ws;

          ws.onopen = () => {
            console.log('Connected to signaling server');
            setError(null);
          };

          ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (isOpen) {
              setError('Connection error. Please try again.');
            }
          };

          ws.onclose = () => {
            console.log('WebSocket connection closed');
            if (isOpen && wsRef.current === ws && !isCleaningUpRef.current) {
              setTimeout(connectWebSocket, 3000);
            }
          };

          ws.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.from === remoteUserId) {
              try {
                switch (message.type) {
                  case 'offer':
                    if (peerConnectionRef.current) {
                      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.data));
                      const answer = await peerConnectionRef.current.createAnswer();
                      await peerConnectionRef.current.setLocalDescription(answer);
                      ws.send(JSON.stringify({
                        type: 'answer',
                        target: remoteUserId,
                        from: localUserId,
                        data: answer
                      }));
                    }
                    break;
                  case 'answer':
                    if (peerConnectionRef.current) {
                      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.data));
                    }
                    break;
                  case 'ice-candidate':
                    if (peerConnectionRef.current) {
                      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(message.data));
                    }
                    break;
                }
              } catch (err) {
                console.error('Error handling signaling message:', err);
                setError('Failed to establish connection');
              }
            }
          };
        } catch (err) {
          console.error('WebSocket connection error:', err);
          if (isOpen) {
            setError('Failed to connect to signaling server');
            setTimeout(connectWebSocket, 3000);
          }
        }
      };

      connectWebSocket();

      // Get local media stream with user preferences
      // Start with audio only by default, add video only if user hasn't disabled it
      const mediaConstraints = {
        audio: true,
        video: !isVideoOff // Start with video off if isVideoOff is true
      };

      console.log(`[VideoCall] Requesting media with constraints:`, mediaConstraints);

      navigator.mediaDevices
        .getUserMedia(mediaConstraints)
        .then((stream) => {
          console.log(`[VideoCall] Got media stream with ${stream.getAudioTracks().length} audio tracks and ${stream.getVideoTracks().length} video tracks`);

          // Set initial mute state for audio tracks
          if (isMuted) {
            stream.getAudioTracks().forEach(track => {
              track.enabled = false;
              console.log(`[VideoCall] Initially muting audio track: ${track.id}`);
            });
          }

          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          // Initialize peer connection
          const configuration = {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          };

          const peerConnection = new RTCPeerConnection(configuration);
          peerConnectionRef.current = peerConnection;

          // Add local stream to peer connection
          stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
          });

          // Handle ICE candidates
          peerConnection.onicecandidate = (event) => {
            if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'ice-candidate',
                target: remoteUserId,
                from: localUserId,
                data: event.candidate
              }));
            }
          };

          // Handle remote stream
          peerConnection.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
            }
            setIsConnecting(false);
          };

          // Create and send offer
          peerConnection.createOffer()
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                  type: 'offer',
                  target: remoteUserId,
                  from: localUserId,
                  data: peerConnection.localDescription
                }));
              } else {
                throw new Error('WebSocket not connected');
              }
            })
            .catch(err => {
              console.error('Error creating offer:', err);
              setError('Failed to create connection offer');
            });
        })
        .catch((err) => {
          console.error('Error accessing media devices:', err);
          setError('Failed to access camera and microphone');
        });

      // Cleanup function - ensure all resources are properly released
      return () => {
        console.log('[VideoCall] Cleaning up video call and releasing all resources...');
        isCleaningUpRef.current = true;

        // 1. First stop all media tracks to immediately release camera/mic
        if (localStream) {
          console.log('[VideoCall] Stopping local media tracks:');
          localStream.getTracks().forEach(track => {
            const trackType = track.kind;
            const trackId = track.id;
            const trackState = track.readyState;

            try {
              track.stop();
              console.log(`[VideoCall] Successfully stopped ${trackType} track ${trackId} (was ${trackState})`);
            } catch (err) {
              console.error(`[VideoCall] Error stopping ${trackType} track:`, err);
            }
          });
        } else {
          console.log('[VideoCall] No local stream to clean up');
        }

        if (remoteStream) {
          console.log('[VideoCall] Stopping remote media tracks:');
          remoteStream.getTracks().forEach(track => {
            try {
              track.stop();
              console.log(`[VideoCall] Stopped remote ${track.kind} track: ${track.id}`);
            } catch (err) {
              console.error('[VideoCall] Error stopping remote track:', err);
            }
          });
        }

        // 2. Clear video elements to prevent memory leaks
        if (localVideoRef.current) {
          console.log('[VideoCall] Clearing local video element');
          localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
          console.log('[VideoCall] Clearing remote video element');
          remoteVideoRef.current.srcObject = null;
        }

        // 3. Close peer connection
        if (peerConnectionRef.current) {
          try {
            // Remove all tracks from peer connection
            const senders = peerConnectionRef.current.getSenders();
            console.log(`[VideoCall] Removing ${senders.length} senders from peer connection`);

            senders.forEach(sender => {
              if (sender.track) {
                try {
                  sender.track.stop(); // Stop any remaining tracks
                  console.log(`[VideoCall] Stopped track in sender: ${sender.track.kind}`);
                } catch (err) {
                  console.error('[VideoCall] Error stopping sender track:', err);
                }
              }

              try {
                peerConnectionRef.current?.removeTrack(sender);
              } catch (err) {
                console.error('[VideoCall] Error removing track from peer connection:', err);
              }
            });

            // Close the connection
            peerConnectionRef.current.close();
            console.log('[VideoCall] Peer connection closed');
          } catch (e) {
            console.error('[VideoCall] Error closing peer connection:', e);
          } finally {
            peerConnectionRef.current = null;
          }
        }

        // 4. Close WebSocket
        if (wsRef.current) {
          try {
            wsRef.current.onclose = null; // Remove event handlers
            wsRef.current.onerror = null;
            wsRef.current.onmessage = null;
            wsRef.current.close();
            console.log('[VideoCall] WebSocket connection closed');
          } catch (err) {
            console.error('[VideoCall] Error closing WebSocket:', err);
          } finally {
            wsRef.current = null;
          }
        }

        // 5. Reset state
        console.log('[VideoCall] Resetting component state');
        setLocalStream(null);
        setRemoteStream(null);
        setIsConnecting(true);
        setError(null);
        setIsMuted(false);
        setIsVideoOff(false);

        console.log('[VideoCall] Cleanup complete - all resources released');
      };
    }
  }, [isOpen, localUserId, remoteUserId]);

  const toggleMute = () => {
    if (localStream) {
      console.log(`[VideoCall] ${isMuted ? 'Unmuting' : 'Muting'} microphone`);

      // Properly enable/disable audio tracks
      localStream.getAudioTracks().forEach((track) => {
        // This properly disables the track without stopping it
        // When track.enabled = false, audio is not transmitted but mic remains active
        // When track.enabled = true, audio is transmitted
        track.enabled = !track.enabled;
        console.log(`[VideoCall] Audio track ${track.id} ${track.enabled ? 'enabled' : 'disabled'}`);
      });

      setIsMuted(!isMuted);
      console.log(`[VideoCall] Microphone ${!isMuted ? 'muted' : 'unmuted'} successfully`);
    }
  };

  const toggleVideo = async () => {
    if (!localStream) return;

    if (isVideoOff) {
      // Turn video ON - only request video access when needed
      try {
        console.log('[VideoCall] Turning camera ON');
        // Only request video, keep existing audio track
        const newVideoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = newVideoStream.getVideoTracks()[0];

        // Create a new combined stream with existing audio and new video
        const combinedStream = new MediaStream();

        // Add existing audio tracks
        localStream.getAudioTracks().forEach(track => {
          combinedStream.addTrack(track);
        });

        // Add the new video track
        combinedStream.addTrack(newVideoTrack);

        // Update video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = combinedStream;
        }

        // Replace the video track in the peer connection
        if (peerConnectionRef.current) {
          const videoSender = peerConnectionRef.current.getSenders().find(
            sender => sender.track?.kind === 'video'
          );

          if (videoSender) {
            console.log('[VideoCall] Replacing video track in peer connection');
            await videoSender.replaceTrack(newVideoTrack);
          } else {
            console.log('[VideoCall] Adding new video track to peer connection');
            peerConnectionRef.current.addTrack(newVideoTrack, combinedStream);
          }
        }

        // Clean up old stream's video tracks to release camera
        localStream.getVideoTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
          }
        });

        setLocalStream(combinedStream);
        setIsVideoOff(false);
        console.log('[VideoCall] Camera turned ON successfully');
      } catch (err) {
        console.error('[VideoCall] Error turning camera on:', err);
        setError('Failed to turn on camera. Please check permissions.');
      }
    } else {
      // Turn video OFF - explicitly stop the camera to release the resource
      console.log('[VideoCall] Turning camera OFF');

      // Stop all video tracks to release camera
      localStream.getVideoTracks().forEach((track) => {
        console.log(`[VideoCall] Stopping video track: ${track.id}`);
        track.stop();
      });

      // Remove video track from peer connection
      if (peerConnectionRef.current) {
        const videoSender = peerConnectionRef.current.getSenders().find(
          sender => sender.track?.kind === 'video'
        );

        if (videoSender && videoSender.track) {
          console.log('[VideoCall] Stopping video track in peer connection');
          videoSender.track.stop();
        }
      }

      setIsVideoOff(true);
      console.log('[VideoCall] Camera turned OFF successfully');
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: 'black'
      }}>
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Typography color="white">
              {isConnecting ? 'Connecting...' : 'No video'}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            width: '100px',
            height: '80px',
            borderRadius: 1,
            overflow: 'hidden',
            border: '2px solid white'
          }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {isVideoOff && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1
              }}
            >
              <VideocamOffIcon sx={{ color: 'white', fontSize: '2rem', mb: 1 }} />
              <Typography variant="caption" color="white" sx={{ fontSize: '0.65rem' }}>
                Camera Off
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        gap: 1,
        p: 1,
        bgcolor: 'background.paper'
      }}>
        <IconButton
          size="small"
          onClick={toggleMute}
          color={isMuted ? 'error' : 'primary'}
        >
          {isMuted ? <MicOffIcon fontSize="small" /> : <MicIcon fontSize="small" />}
        </IconButton>
        <IconButton
          size="small"
          onClick={toggleVideo}
          color={isVideoOff ? 'error' : 'primary'}
        >
          {isVideoOff ? <VideocamOffIcon fontSize="small" /> : <VideocamIcon fontSize="small" />}
        </IconButton>
        <IconButton
          size="small"
          onClick={handleEndCall}
          color="error"
        >
          <CallEndIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default VideoCall;
