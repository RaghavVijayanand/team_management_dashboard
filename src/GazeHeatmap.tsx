import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, useTheme, Paper, CircularProgress } from '@mui/material';

interface GazeCoordinate {
  x: number;
  y: number;
  timestamp: number;
}

interface GazeHeatmapProps {
  gazeData: GazeCoordinate[];
  width?: number;
  height?: number;
}

interface EngagementMetric {
  name: string;
  value: number;
  color: string;
}

export default function GazeHeatmap({ gazeData, width = 800, height = 400 }: GazeHeatmapProps) {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engagementScore, setEngagementScore] = useState(0);
  const [focusPattern, setFocusPattern] = useState('normal');

  // Calculate engagement metrics based on gaze data
  useEffect(() => {
    if (gazeData.length === 0) return;

    // Calculate variance in gaze positions as a simple engagement metric
    const xPositions = gazeData.map(point => point.x);
    const yPositions = gazeData.map(point => point.y);
    
    const xVariance = calculateVariance(xPositions);
    const yVariance = calculateVariance(yPositions);
    
    // Total variance as a measure of how scattered the gaze is
    const totalVariance = xVariance + yVariance;
    
    // Convert to engagement score (high variance = low engagement)
    const score = Math.max(0, Math.min(100, Math.round(100 * (1 - totalVariance * 3))));
    setEngagementScore(score);
    
    // Determine focus pattern
    if (score > 80) {
      setFocusPattern('highly focused');
    } else if (score > 60) {
      setFocusPattern('focused');
    } else if (score > 40) {
      setFocusPattern('normal');
    } else if (score > 20) {
      setFocusPattern('distracted');
    } else {
      setFocusPattern('highly distracted');
    }
  }, [gazeData]);

  // Draw heatmap visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Add screen outline representing a monitor/display
    ctx.strokeStyle = theme.palette.divider;
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Draw a simple screen layout
    ctx.strokeStyle = theme.palette.divider;
    ctx.lineWidth = 1;
    
    // Header area
    ctx.fillStyle = theme.palette.primary.light + '22';
    ctx.fillRect(20, 20, width - 40, 60);
    
    // Content areas
    ctx.fillStyle = theme.palette.background.paper + '44';
    ctx.fillRect(20, 100, (width - 60) * 0.7, height - 120);
    ctx.fillRect((width - 60) * 0.7 + 40, 100, (width - 60) * 0.3, height - 120);

    // Draw heatmap of gazes
    gazeData.forEach((point, index) => {
      const gradient = ctx.createRadialGradient(
        point.x * width,
        point.y * height,
        0,
        point.x * width,
        point.y * height,
        20
      );
      
      // Change color based on recency (newer points are more intense)
      const alpha = 0.3 + 0.7 * (index / gazeData.length);
      gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
      gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 20, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.globalAlpha = 1.0;
    
    // Draw latest gaze point with a crosshair
    if (gazeData.length > 0) {
      const latestPoint = gazeData[gazeData.length - 1];
      const x = latestPoint.x * width;
      const y = latestPoint.y * height;
      
      ctx.strokeStyle = theme.palette.secondary.main;
      ctx.lineWidth = 2;
      
      // Crosshair
      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x + 10, y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x, y + 10);
      ctx.stroke();
      
      // Circle
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [gazeData, theme, width, height]);

  // Engagement metrics for visualization
  const engagementMetrics: EngagementMetric[] = [
    { name: 'Engaged', value: engagementScore, color: getEngagementColor(engagementScore) },
    { name: 'Disengaged', value: 100 - engagementScore, color: theme.palette.grey[300] }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
      <Box sx={{ flex: { xs: '1', md: '2' } }}>
        <Paper elevation={2} sx={{ p: 2, height: height + 20 }}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              style={{
                borderRadius: theme.shape.borderRadius,
                boxShadow: theme.shadows[1]
              }}
            />
          </Box>
        </Paper>
      </Box>
      <Box sx={{ flex: { xs: '1', md: '1' } }}>
        <Paper elevation={2} sx={{ p: 2, height: height + 20 }}>
          <Typography variant="h6" gutterBottom>Engagement Analytics</Typography>
          
          <Box sx={{ textAlign: 'center', my: 2 }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <CircularProgress
                variant="determinate"
                value={engagementScore}
                size={120}
                thickness={5}
                sx={{
                  color: getEngagementColor(engagementScore),
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  },
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h5" component="div">
                  {`${engagementScore}%`}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Typography variant="body1" align="center" gutterBottom>
            Attention pattern: <strong>{focusPattern}</strong>
          </Typography>
          
          <Typography variant="body2" sx={{ mt: 3 }}>
            Based on {gazeData.length} gaze data points, the current engagement level suggests 
            {engagementScore > 70 ? ' high focus and active participation.' : 
              engagementScore > 40 ? ' moderate engagement with occasional distractions.' : 
              ' significant distraction or disengagement.'}
          </Typography>
          
          <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
            This analysis can help identify attention patterns during meetings and optimize content 
            presentation for better engagement.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}

// Utility functions
function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

function getEngagementColor(score: number): string {
  if (score > 80) return '#4caf50'; // Green for high engagement
  if (score > 60) return '#8bc34a'; // Light green
  if (score > 40) return '#ffc107'; // Amber
  if (score > 20) return '#ff9800'; // Orange
  return '#f44336'; // Red for low engagement
}