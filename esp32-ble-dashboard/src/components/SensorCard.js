import React from 'react';
import { AlertTriangle } from 'lucide-react';

const SensorCard = ({ 
  title, 
  icon, 
  value, 
  unit, 
  status, 
  limite, 
  maxValue, 
  color,
  timestamp
}) => {
  const getProgressPercentage = () => {
    if (maxValue === "N/A") return 0;
    return Math.min((value / maxValue) * 100, 100);
  };

  const getProgressClass = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 90) return 'alert';
    if (percentage >= 70) return 'warning';
    return 'normal';
  };

  const getStatusText = () => {
    if (status === 'alert') return 'Alerta';
    return 'Normal';
  };

  return (
    <div className={`sensor-card ${status === 'alert' ? 'alert' : ''}`}>
      <div className="sensor-header">
        <div className="sensor-title">
          {icon}
          {title}
        </div>
        <div className={`sensor-status ${status}`}>
          {status === 'alert' && <AlertTriangle size={14} />}
          {getStatusText()}
        </div>
      </div>
      
      <div className="sensor-value">
        {value}
        <span className="sensor-unit">{unit}</span>
      </div>
      
      {maxValue !== "N/A" && (
        <div className="progress-bar">
          <div 
            className={`progress-fill ${getProgressClass()}`}
            style={{ 
              width: `${getProgressPercentage()}%`,
              backgroundColor: status === 'alert' ? '#ef4444' : color
            }}
          ></div>
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        fontSize: '0.9rem', 
        color: '#6b7280',
        marginTop: '10px'
      }}>
        <span>Limite: {limite}</span>
        <span>Atualizado: {timestamp}</span>
      </div>
    </div>
  );
};

export default SensorCard;

