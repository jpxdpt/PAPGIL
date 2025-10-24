import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const AlertBanner = ({ alerts = [], onDismiss }) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div className="alert-banner">
      <div className="alert-icon">
        <AlertTriangle size={24} />
      </div>
      <div className="alert-text">
        {alerts[0].message || alerts[0].mensagem}
      </div>
      <button 
        onClick={() => onDismiss(alerts[0].id)}
        style={{
          background: 'none',
          border: 'none',
          color: '#dc2626',
          cursor: 'pointer',
          padding: '4px'
        }}
      >
        <X size={20} />
      </button>
    </div>
  );
};

export default AlertBanner;


