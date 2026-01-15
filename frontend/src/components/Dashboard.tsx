'use client';

import React from 'react';
import { SystemStatus } from '@/hooks/useWebSocket';

interface DashboardProps {
  status: SystemStatus;
}

const Gauge: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  // Color logic: <50% Green, <80% Blue/Yellow, >=80% Red
  let color = '#4ade80'; // Green
  if (value >= 80) color = '#f87171'; // Red
  else if (value >= 50) color = '#60a5fa'; // Blue
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {/* Background Circle (Neumorphism recessed) */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'var(--surface)',
          boxShadow: 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)',
        }} />
        
        {/* SVG Gauge */}
        <svg width="80" height="80" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
          <circle
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="6"
            fill="transparent"
            r={radius}
            cx="40"
            cy="40"
          />
          <circle
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx="40"
            cy="40"
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease' }}
          />
        </svg>
        
        {/* Value Text */}
        <div style={{ zIndex: 1, fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          {Math.round(value)}%
        </div>
      </div>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ status }) => {
  return (
    <div style={{
      display: 'flex',
      gap: '24px',
      padding: '20px',
      background: 'var(--surface)',
      borderRadius: '24px',
      marginBottom: '20px',
      // Start Neumorphism: Convex
      boxShadow: '8px 8px 16px var(--shadow-dark), -8px -8px 16px var(--shadow-light)',
      border: '1px solid rgba(255,255,255,0.02)',
      justifyContent: 'center',
      width: '100%',
      maxWidth: '600px',
    }}>
      <Gauge label="CPU" value={status.cpu} />
      <Gauge label="MEM" value={status.memory} />
      <Gauge label="DISK" value={status.disk} />
    </div>
  );
};
