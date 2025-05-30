import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
// Try more explicit import path for type
import type { PerformanceDataPoint } from '../types/index'; 
import styles from '../styles/TypingTest.module.css'; // Reuse styles

interface PerformanceGraphProps {
  data: PerformanceDataPoint[];
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload; // Access the full data point
    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>{`Word: ${label}`}</p>
        <p className={styles.tooltipWpm}>{`WPM: ${dataPoint.wpm}`}</p>
        <p className={styles.tooltipErrors}>{`Errors: ${dataPoint.errors}`}</p>
      </div>
    );
  }
  return null;
};

const PerformanceGraph: React.FC<PerformanceGraphProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>No performance data available to display graph.</div>;
  }

  const maxWpm = Math.max(...data.map(p => p.wpm), 60);
  const yAxisMaxWpm = Math.ceil((maxWpm + 10) / 10) * 10;

  const maxErrors = Math.max(...data.map(p => p.errors), 1);
  const yAxisMaxErrors = Math.ceil(maxErrors + 1);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 0,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.3} />
        <XAxis 
          dataKey="index" 
          stroke="#B0B0B0" 
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          yAxisId="left" 
          stroke="#B0B0B0" 
          tick={{ fontSize: 12 }} 
          domain={[0, yAxisMaxWpm]}
          label={{ value: 'Words per Minute', angle: -90, position: 'insideLeft', fill: '#B0B0B0', fontSize: 12, dx: -5 }}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          stroke="#B0B0B0" 
          tick={{ fontSize: 12 }} 
          domain={[0, yAxisMaxErrors]}
          allowDecimals={false}
          label={{ value: 'Errors', angle: 90, position: 'insideRight', fill: '#B0B0B0', fontSize: 12, dx: 5 }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#AAAAAA', strokeWidth: 1, strokeDasharray: '3 3' }} />
        <Line 
          yAxisId="left" 
          type="monotone" 
          dataKey="wpm" 
          stroke="#D2B55B"
          strokeWidth={2}
          dot={{ stroke: '#D2B55B', strokeWidth: 1, r: 3, fill: '#D2B55B' }}
          activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2, fill: '#D2B55B' }}
          name="WPM"
        />
         <Line 
           yAxisId="right" 
           type="monotone" 
           dataKey="errors" 
           stroke="#999999"
           strokeWidth={1.5}
           dot={{ stroke: '#999999', strokeWidth: 1, r: 2, fill: '#999999' }}
           activeDot={{ r: 5, stroke: '#FFFFFF', strokeWidth: 1, fill: '#999999' }}
           name="Errors per Word"
         />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PerformanceGraph;

