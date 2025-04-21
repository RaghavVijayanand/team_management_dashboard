import React, { useRef, useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Alert,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  VideocamOff as CameraOffIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Adjust as AdjustIcon,
} from '@mui/icons-material';
import api from './services/api';
import GazeHeatmap from './components/GazeHeatmap';

interface EyeGazeData {
  isLookingAtScreen: boolean;
  confidence: number;
  timestamp: number;
  x: number;
  y: number;
}

interface CalibrationPoint {
  x: number;
  y: number;
}

const FullScreenCalibration: React.FC<{
  currentPoint: CalibrationPoint;
  pointIndex: number;
  totalPoints: number;
  onPointClick: () => void;
}> = ({ currentPoint, pointIndex, totalPoints, onPointClick }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h4" color="white" gutterBottom sx={{ position: 'absolute', top: '5%' }}>
        Look at the point and click it
      </Typography>
      <Typography variant="h6" color="white" sx={{ position: 'absolute', top: '12%' }}>
        Point {pointIndex + 1} of {totalPoints}
      </Typography>
      <Box
        onClick={onPointClick}
        sx={{
          position: 'absolute',
          left: `${currentPoint.x * 100}%`,
          top: `${currentPoint.y * 100}%`,
          transform: 'translate(-50%, -50%)',
          cursor: 'pointer',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <Box sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '2px solid white',
          animation: 'pulse 1.5s infinite',
          '@keyframes pulse': {
            '0%': {
              transform: 'scale(0.8)',
              opacity: 0.5,
            },
            '70%': {
              transform: 'scale(1.3)',
              opacity: 0.8,
            },
            '100%': {
              transform: 'scale(0.8)',
              opacity: 0.5,
            },
          },
        }}>
          <Box sx={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            opacity: 0.8
          }} />
        </Box>
      </Box>
    </Box>
  );
};

const CALIBRATION_POINTS: CalibrationPoint[] = [
  { x: 0.05, y: 0.05 }, // Top-left
  { x: 0.5, y: 0.05 },  // Top-center
  { x: 0.95, y: 0.05 }, // Top-right
  { x: 0.05, y: 0.5 },  // Middle-left
  { x: 0.5, y: 0.5 },   // Center
  { x: 0.95, y: 0.5 },  // Middle-right
  { x: 0.05, y: 0.95 }, // Bottom-left
  { x: 0.5, y: 0.95 },  // Bottom-center
  { x: 0.95, y: 0.95 }, // Bottom-right
];

export default function EyeGazeTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'idle' | 'looking' | 'not-looking'>('idle');
  const [stats, setStats] = useState({
    totalTime: 0,
    lookingTime: 0,
    notLookingTime: 0,
    attentionPercentage: 0
  });
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [currentCalibrationPoint, setCurrentCalibrationPoint] = useState(0);
  const [calibrationComplete, setCalibrationComplete] = useState(false);
  const [gazePoints, setGazePoints] = useState<{ x: number; y: number; timestamp: number; }[]>([]);

  // Initialize camera
  const startCamera = async () => {
    try {
      setError(null);
      console.log('Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true  // Use simplest possible constraints
      });
      
      console.log('Camera access granted');
      
      if (videoRef.current) {
        // Force browser to show the video feed
        videoRef.current.style.display = 'block';
        videoRef.current.style.visibility = 'visible';
        
        // Set stream
        videoRef.current.srcObject = stream;
        console.log('Stream set to video element');
        
        // Force play on metadata loaded
        videoRef.current.onloadedmetadata = async () => {
          console.log('Video metadata loaded');
          try {
            await videoRef.current?.play();
            console.log('Video playing');
            setIsCameraActive(true);
          } catch (err) {
            console.error('Play error:', err);
            setError('Failed to play video stream');
          }
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Failed to access camera. Please ensure you have granted camera permissions.');
      setIsCameraActive(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  // Toggle tracking
  const toggleTracking = () => {
    if (isTracking) {
      setIsTracking(false);
    } else {
      if (!isCameraActive) {
        startCamera();
      }
      setIsTracking(true);
    }
  };

  // Save eye gaze data
  const saveEyeGazeData = async (data: EyeGazeData) => {
    try {
      await api.post('/api/eye-gaze', {
        isLookingAtScreen: data.isLookingAtScreen,
        confidence: data.confidence,
        sessionId: Date.now().toString()
      });
    } catch (err) {
      console.error('Error saving eye gaze data:', err);
    }
  };

  // Start calibration
  const startCalibration = () => {
    setIsCalibrating(true);
    setCurrentCalibrationPoint(0);
    setCalibrationComplete(false);
  };

  // Handle calibration point click
  const handleCalibrationPointClick = () => {
    if (currentCalibrationPoint < CALIBRATION_POINTS.length - 1) {
      setCurrentCalibrationPoint(prev => prev + 1);
    } else {
      setIsCalibrating(false);
      setCalibrationComplete(true);
      setIsTracking(true);
    }
  };

  // Simulate eye tracking with gaze position
  useEffect(() => {
    let trackingInterval: number | null = null;
    
    if (isTracking && isCameraActive && calibrationComplete) {
      trackingInterval = window.setInterval(() => {
        // Simulate gaze position (in real implementation, this would come from eye tracking)
        const x = Math.random();
        const y = Math.random();
        const isLooking = Math.random() > 0.3;
        const confidence = Math.random() * 0.3 + 0.7;
        
        const newGazeData: EyeGazeData = {
          isLookingAtScreen: isLooking,
          confidence,
          timestamp: Date.now(),
          x,
          y
        };
        
        // Update gaze points
        setGazePoints(prev => [...prev, { x, y, timestamp: Date.now() }].slice(-50));
        
        // Update current status
        setCurrentStatus(isLooking ? 'looking' : 'not-looking');
        
        // Update stats
        setStats(prev => {
          const newTotalTime = prev.totalTime + 1;
          const newLookingTime = isLooking ? prev.lookingTime + 1 : prev.lookingTime;
          const newNotLookingTime = !isLooking ? prev.notLookingTime + 1 : prev.notLookingTime;
          
          return {
            totalTime: newTotalTime,
            lookingTime: newLookingTime,
            notLookingTime: newNotLookingTime,
            attentionPercentage: Math.round((newLookingTime / newTotalTime) * 100)
          };
        });
        
        // Save data to backend
        saveEyeGazeData(newGazeData);
      }, 1000);
    }
    
    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
    };
  }, [isTracking, isCameraActive, calibrationComplete]);

  // Get status color
  const getStatusColor = () => {
    switch (currentStatus) {
      case 'looking':
        return 'success.main';
      case 'not-looking':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (currentStatus) {
      case 'looking':
        return 'Looking at screen';
      case 'not-looking':
        return 'Not looking at screen';
      default:
        return 'Idle';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
        Eye Gaze Tracker
      </Typography>
      
      <Typography variant="body1" paragraph>
        This feature tracks whether you are looking at the screen or not, helping you monitor your attention and focus.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Camera Feed</Typography>
              <Box>
                <Tooltip title={isCameraActive ? "Stop Camera" : "Start Camera"}>
                  <IconButton 
                    onClick={isCameraActive ? stopCamera : startCamera}
                    color={isCameraActive ? "error" : "primary"}
                  >
                    {isCameraActive ? <CameraOffIcon /> : <CameraIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Calibrate">
                  <span>
                    <IconButton
                      onClick={startCalibration}
                      disabled={!isCameraActive || isTracking}
                      color="primary"
                    >
                      <AdjustIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={isTracking ? "Stop Tracking" : "Start Tracking"}>
                  <span>
                    <IconButton 
                      onClick={toggleTracking}
                      color={isTracking ? "error" : "success"}
                      disabled={!isCameraActive || !calibrationComplete}
                    >
                      {isTracking ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>
            
            <Box 
              sx={{ 
                width: '100%',
                height: '400px',
                backgroundColor: '#000',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& video': {
                  display: 'block',
                  visibility: 'visible',
                  width: '100%',
                  height: '100%'
                }
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  display: 'block',
                  visibility: 'visible',
                  width: '100%',
                  height: '100%'
                }}
              />
            </Box>

            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                p: 2,
                mt: 2,
                borderRadius: 1,
                backgroundColor: `${getStatusColor()}15`,
                border: `1px solid ${getStatusColor()}30`
              }}
            >
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  backgroundColor: getStatusColor(),
                  mr: 1
                }} 
              />
              <Typography variant="h6" color={getStatusColor()}>
                {getStatusText()}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Attention Statistics</Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Total Time
                    </Typography>
                    <Typography variant="h5">
                      {Math.floor(stats.totalTime / 60)}m {stats.totalTime % 60}s
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Attention
                    </Typography>
                    <Typography variant="h5" color="primary.main">
                      {stats.attentionPercentage}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Gaze Heatmap</Typography>
              <Box sx={{ height: 200 }}>
                <GazeHeatmap gazeData={gazePoints} />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {isCalibrating && (
        <FullScreenCalibration
          currentPoint={CALIBRATION_POINTS[currentCalibrationPoint]}
          pointIndex={currentCalibrationPoint}
          totalPoints={CALIBRATION_POINTS.length}
          onPointClick={handleCalibrationPointClick}
        />
      )}
    </Box>
  );
} 