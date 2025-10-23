import React from 'react';
import { Clock, Activity } from 'lucide-react';

const HistoryList = ({ history = [] }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusIcon = (potenciometro, limitePotenciometro) => {
    if (potenciometro > limitePotenciometro) {
      return <span style={{ color: '#ef4444' }}>⚠️</span>;
    }
    return <span style={{ color: '#10b981' }}>✅</span>;
  };

  if (!history || history.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 20px',
        color: '#6b7280',
        fontSize: '1.1rem'
      }}>
        <Clock size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p>Nenhum dado registado ainda</p>
        <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>
          Inicie a monitorização para ver os dados do potenciômetro
        </p>
      </div>
    );
  }

  return (
    <div className="history-list">
      {history.map((item, index) => (
        <div key={item.id || index} className="history-item">
          <div className="history-time">
            <Clock size={14} style={{ marginRight: '8px' }} />
            {formatTime(item.timestamp)}
          </div>
          
          <div className="history-values">
            <div className="history-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={14} style={{ color: '#3b82f6' }} />
              <span>Potenciômetro: <strong>{item.potenciometro}</strong></span>
            </div>
          </div>
          
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {getStatusIcon(item.potenciometro, 2000)} {/* Limite do LED ESP32 */}
                  </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;

