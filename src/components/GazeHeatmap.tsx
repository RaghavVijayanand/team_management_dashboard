import React, { useEffect, useRef } from 'react';

interface GazePoint {
  x: number;
  y: number;
  timestamp: number;
}

interface GazeHeatmapProps {
  gazeData: GazePoint[];
  width?: number;
  height?: number;
}

const GazeHeatmap: React.FC<GazeHeatmapProps> = ({ gazeData, width = 800, height = 200 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw heatmap
    gazeData.forEach((point) => {
      const gradient = ctx.createRadialGradient(
        point.x * width, point.y * height,
        0,
        point.x * width, point.y * height,
        20
      );

      gradient.addColorStop(0, 'rgba(255, 0, 0, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 20, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw points
    gazeData.forEach((point) => {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [gazeData, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px'
      }}
    />
  );
};

export default GazeHeatmap; 