
import React from 'react';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';

// Define interface for workload data
interface WorkloadData {
  name: string;
  value: number;
}

// Mock data with consistent typing
const mockData: WorkloadData[] = [
  { name: 'Monday', value: 4 },
  { name: 'Tuesday', value: 3 },
  { name: 'Wednesday', value: 5 },
  { name: 'Thursday', value: 2 },
  { name: 'Friday', value: 4 },
];

export default function WorkloadHeatmap() {
  const theme = useTheme();

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Weekly Workload Distribution
        </Typography>
        <Box sx={{ height: 300, width: '100%', display: 'flex', alignItems: 'flex-end', gap: 1 }}>
  {mockData.map((day) => (
    <Box
      key={day.name}
      sx={{
        width: '14%',
        height: `${day.value * 20}%`,
        backgroundColor: theme.palette.primary.main,
        opacity: 0.3 + (day.value / 10),
        borderRadius: 1
      }}
    />
  ))}
</Box>
      </CardContent>
    </Card>
  );
}