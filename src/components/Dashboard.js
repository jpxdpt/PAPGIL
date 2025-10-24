import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Play,
  Pause,
  RotateCcw,
  Bluetooth,
  BluetoothConnected,
  Lightbulb,
  LightbulbOff,
  Thermometer,
  Droplets
} from 'lucide-react';
import SensorCard from './SensorCard';
import Chart from './Chart';
import HistoryList from './HistoryList';
import AlertBanner from './AlertBanner';

const Dashboard = () => {
  console.log('Dashboard component loaded');
  const [sensorData, setSensorData] = useState({
    potenciometro: 0,
    temperatura: 0,
    humidade: 0,
    timestamp: Date.now()
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [bluetoothDevice, setBluetoothDevice] = useState(null);
  const [gattServer, setGattServer] = useState(null);
  const [potentiometerCharacteristic, setPotentiometerCharacteristic] = useState(null);
  const [temperatureCharacteristic, setTemperatureCharacteristic] = useState(null);
  const [humidityCharacteristic, setHumidityCharacteristic] = useState(null);
  const [ledCharacteristic, setLedCharacteristic] = useState(null);
  const [notificationCharacteristic, setNotificationCharacteristic] = useState(null);
  const [ledState, setLedState] = useState(false);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [settings, setSettings] = useState({
    limitePotenciometro: 2000, // Limite do LED para ESP32 (0-4095)
    alertasAtivos: true,
    notificacaoSempre: false // Notificar sempre que passar o limite
  });
  const [showLedPopup, setShowLedPopup] = useState(false);
  const [ledPopupMessage, setLedPopupMessage] = useState('');
  const [previousLedState, setPreviousLedState] = useState(false);

  const audioRef = useRef(null);

  // Registrar Service Worker para notificações no telemóvel
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado:', registration);
        })
        .catch((error) => {
          console.log('Erro ao registrar Service Worker:', error);
        });
    }
  }, []);

  // UUIDs do ESP32 BLE
  const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
  const POTENTIOMETER_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
  const TEMPERATURE_CHARACTERISTIC_UUID = 'd0ffee01-1234-5678-9abc-def012345678';
  const HUMIDITY_CHARACTERISTIC_UUID = 'e0ffee01-1234-5678-9abc-def012345678';
  const NOTIFICATION_CHARACTERISTIC_UUID = 'c0ffee01-1234-5678-9abc-def012345678';

  // Procurar dispositivos ESP32 BLE
  const scanForDevices = async () => {
    try {
      if (!navigator.bluetooth) {
        alert('Bluetooth não é suportado neste navegador. Use Chrome ou Edge.');
        return;
      }

      setIsScanning(true);
      setShowDeviceList(true);
      setAvailableDevices([]);

      console.log('Iniciando busca por dispositivos BLE...');
      console.log('SERVICE_UUID:', SERVICE_UUID);

      // Procurar dispositivos ESP32 - tentar diferentes abordagens
      let device;
      
      try {
        // Primeiro, tentar com filtros específicos
        device = await navigator.bluetooth.requestDevice({
          filters: [
            { name: 'ESP32_BLE_Pot_LED' },
            { name: 'ESP32' },
            { namePrefix: 'ESP' }
          ],
          optionalServices: [SERVICE_UUID]
        });
        console.log('Dispositivo encontrado com filtros específicos:', device);
      } catch (filterError) {
        console.log('Filtros específicos falharam, tentando aceitar todos os dispositivos...');
        
        // Se falhar, tentar aceitar todos os dispositivos
        device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [SERVICE_UUID]
        });
        console.log('Dispositivo encontrado aceitando todos:', device);
      }

      // Adicionar dispositivo encontrado à lista
      console.log('Dispositivo encontrado:', device);
      console.log('Nome do dispositivo:', device.name);
      console.log('ID do dispositivo:', device.id);
      
      const deviceInfo = {
        id: device.id,
        name: device.name || 'ESP32 (Desconhecido)',
        type: 'BLE',
        device: device
      };

      setAvailableDevices([deviceInfo]);
      setIsScanning(false);

    } catch (error) {
      console.error('Erro ao procurar dispositivos:', error);
      setIsScanning(false);
      
      if (error.name === 'NotFoundError') {
        alert('Nenhum dispositivo BLE encontrado. Verifique se o ESP32 está ligado e em modo BLE.');
        setShowDeviceList(false);
      } else if (error.name === 'SecurityError') {
        alert('Erro de segurança. Certifique-se de que o site tem permissão para aceder ao Bluetooth.');
      } else if (error.name === 'NotSupportedError') {
        alert('Web Bluetooth não é suportado. Use Chrome ou Edge.');
      } else {
        alert('Erro ao procurar dispositivos Bluetooth: ' + error.message);
        console.error('Detalhes do erro:', error);
      }
    }
  };

  // Conectar ao ESP32
  const connectToESP32 = async (device) => {
    try {
      if (!device.device) {
        alert('Dispositivo inválido');
        return;
      }

      console.log('Conectando ao ESP32:', device.name);
      
      const server = await device.device.gatt.connect();
      setGattServer(server);
      
      // Obter serviço
      const service = await server.getPrimaryService(SERVICE_UUID);
      
      // Obter característica do potenciômetro
      const potChar = await service.getCharacteristic(POTENTIOMETER_CHARACTERISTIC_UUID);
      setPotentiometerCharacteristic(potChar);
      
      // Obter característica de temperatura
      const tempChar = await service.getCharacteristic(TEMPERATURE_CHARACTERISTIC_UUID);
      setTemperatureCharacteristic(tempChar);
      
      // Obter característica de humidade
      const humidityChar = await service.getCharacteristic(HUMIDITY_CHARACTERISTIC_UUID);
      setHumidityCharacteristic(humidityChar);
      
      // Configurar notificações para o potenciômetro
      await potChar.startNotifications();
      potChar.addEventListener('characteristicvaluechanged', handlePotentiometerData);
      
      // Configurar notificações para temperatura
      await tempChar.startNotifications();
      tempChar.addEventListener('characteristicvaluechanged', handleTemperatureData);
      
      // Configurar notificações para humidade
      await humidityChar.startNotifications();
      humidityChar.addEventListener('characteristicvaluechanged', handleHumidityData);
      
      // Obter característica de notificação (se disponível)
      try {
        const notifChar = await service.getCharacteristic(NOTIFICATION_CHARACTERISTIC_UUID);
        setNotificationCharacteristic(notifChar);
        console.log('Característica de notificação configurada');
      } catch (error) {
        console.log('Característica de notificação não disponível:', error.message);
      }
      
      // Adicionar listener para desconexão
      device.device.addEventListener('gattserverdisconnected', () => {
        console.log('ESP32 desconectado');
        setIsBluetoothConnected(false);
        setIsConnected(false);
        setIsMonitoring(false);
        setGattServer(null);
        setPotentiometerCharacteristic(null);
      });

      setIsBluetoothConnected(true);
      setIsConnected(true);
      setBluetoothDevice(device.device);
      setShowDeviceList(false);
      
      alert(`Conectado com sucesso ao ${device.name}!`);
      
    } catch (error) {
      console.error('Erro ao conectar:', error);
      alert('Erro ao conectar ao ESP32: ' + error.message);
    }
  };

  // Processar dados de temperatura
  const handleTemperatureData = (event) => {
    const dataView = event.target.value;
    
    let value;
    try {
      const decodedString = new TextDecoder().decode(dataView);
      value = parseFloat(decodedString.trim());
      
      if (isNaN(value)) {
        console.warn('Valor de temperatura inválido:', decodedString);
        return;
      }
      
      console.log('Temperatura recebida:', value);
      
      setSensorData(prev => ({
        ...prev,
        temperatura: value,
        timestamp: Date.now()
      }));
      
    } catch (error) {
      console.error('Erro ao decodificar temperatura:', error);
    }
  };

  // Processar dados de humidade
  const handleHumidityData = (event) => {
    const dataView = event.target.value;
    
    let value;
    try {
      const decodedString = new TextDecoder().decode(dataView);
      value = parseFloat(decodedString.trim());
      
      if (isNaN(value)) {
        console.warn('Valor de humidade inválido:', decodedString);
        return;
      }
      
      console.log('Humidade recebida:', value);
      
      setSensorData(prev => ({
        ...prev,
        humidade: value,
        timestamp: Date.now()
      }));
      
    } catch (error) {
      console.error('Erro ao decodificar humidade:', error);
    }
  };

  // Processar dados do potenciômetro
  const handlePotentiometerData = (event) => {
    const dataView = event.target.value;
    
    // ESP32 envia dados como string, precisamos decodificar corretamente
    let value;
    try {
      const decodedString = new TextDecoder().decode(dataView);
      value = parseInt(decodedString.trim());
      
      // Verificar se o valor é válido (0-4095 para ESP32)
      if (isNaN(value) || value < 0 || value > 4095) {
        console.warn('Valor inválido recebido:', decodedString, 'Valor numérico:', value);
        return;
      }
      
      console.log('Dados recebidos do ESP32:', {
        raw: Array.from(dataView),
        decoded: decodedString,
        parsed: value
      });
      
    } catch (error) {
      console.error('Erro ao decodificar dados:', error);
      return;
    }
    
    const newData = {
      potenciometro: value,
      timestamp: Date.now()
    };
    
    // Verificar mudança do estado do LED
    const currentLedState = value > settings.limitePotenciometro;
    console.log('Estado do LED:', {
      valor: value,
      limite: settings.limitePotenciometro,
      currentLedState,
      previousLedState,
      mudou: currentLedState && !previousLedState
    });
    
    if (currentLedState && !previousLedState) {
      // LED acabou de ligar
      console.log('🚨 LED LIGOU! Enviando notificação...');
      setLedPopupMessage(`🚨 LED LIGADO! Potenciômetro: ${value} (Limite: ${settings.limitePotenciometro})`);
      setShowLedPopup(true);
      
      // Enviar notificação do sistema
      sendSystemNotification('🚨 LED LIGADO!', {
        body: `Potenciômetro: ${value} (Limite: ${settings.limitePotenciometro})`,
        tag: 'led-alert',
        requireInteraction: true
      });
      
      // Auto-fechar o pop-up após 5 segundos
      setTimeout(() => {
        setShowLedPopup(false);
      }, 5000);
    } else if (currentLedState && settings.notificacaoSempre) {
      // LED continua ligado mas notificar sempre se ativado
      console.log('🚨 LED CONTINUA LIGADO! Enviando notificação...');
      sendSystemNotification('🚨 LED LIGADO!', {
        body: `Potenciômetro: ${value} (Limite: ${settings.limitePotenciometro})`,
        tag: 'led-alert-continuous',
        requireInteraction: true
      });
    } else if (currentLedState) {
      console.log('LED continua ligado, não enviando notificação');
    } else {
      console.log('LED desligado');
    }
    setPreviousLedState(currentLedState);
    
    setSensorData(newData);
    
    // Adicionar ao histórico
    setHistory(prev => [
      { ...newData, id: Date.now() },
      ...prev.slice(0, 99)
    ]);
    
    // Verificar alertas
    checkAlerts(newData);
  };

  // Desconectar do ESP32
  const disconnectESP32 = () => {
    if (bluetoothDevice && gattServer) {
      bluetoothDevice.gatt.disconnect();
    }
    setIsBluetoothConnected(false);
    setIsConnected(false);
    setIsMonitoring(false);
    setBluetoothDevice(null);
    setGattServer(null);
    setPotentiometerCharacteristic(null);
    setTemperatureCharacteristic(null);
    setHumidityCharacteristic(null);
  };

  // LED é controlado automaticamente pelo ESP32 baseado no potenciômetro
  // Não há controle remoto via BLE

  const startMonitoring = () => {
    if (!isBluetoothConnected) {
      alert('Conecte primeiro ao ESP32.');
      return;
    }
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const checkAlerts = (data) => {
    const newAlerts = [];
    
    // Alerta de potenciômetro alto desativado
    // if (data.potenciometro > settings.limitePotenciometro) {
    //   newAlerts.push({
    //     id: Date.now(),
    //     type: 'potenciometro',
    //     message: `Potenciômetro alto: ${data.potenciometro}`,
    //     timestamp: Date.now(),
    //     severity: 'high'
    //   });
    // }
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 4)]);
      
      // Tocar som de alerta
      if (settings.alertasAtivos && audioRef.current) {
        audioRef.current.play().catch(console.log);
      }
    }
  };

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const closeDeviceList = () => {
    setShowDeviceList(false);
    setIsScanning(false);
  };

  // Enviar notificação para o ESP32
  const sendNotification = async (message, type = 'info') => {
    try {
      if (!notificationCharacteristic) {
        console.log('Característica de notificação não disponível');
        return false;
      }

      // Criar payload da notificação
      const notificationData = {
        type: type, // 'info', 'warning', 'alert', 'success'
        message: message,
        timestamp: Date.now()
      };

      // Converter para ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(notificationData));
      
      // Enviar para o ESP32
      await notificationCharacteristic.writeValue(data);
      
      console.log('Notificação enviada:', notificationData);
      return true;
      
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return false;
    }
  };

  // Funções de notificação específicas
  const sendAlertNotification = async (message) => {
    return await sendNotification(message, 'alert');
  };

  const sendWarningNotification = async (message) => {
    return await sendNotification(message, 'warning');
  };

  const sendInfoNotification = async (message) => {
    return await sendNotification(message, 'info');
  };

  const sendSuccessNotification = async (message) => {
    return await sendNotification(message, 'success');
  };

  // Enviar notificação do sistema (barra de notificações)
  const sendSystemNotification = async (title, options = {}) => {
    try {
      console.log('Tentando enviar notificação do sistema:', title);
      
      if (!('Notification' in window)) {
        console.log('Este navegador não suporta notificações do sistema');
        alert('Este navegador não suporta notificações do sistema');
        return false;
      }

      console.log('Permissão atual:', Notification.permission);

      if (Notification.permission === 'granted') {
        console.log('Criando notificação...');
        
        // Tentar usar Service Worker primeiro (para telemóvel)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          try {
            console.log('Enviando notificação via Service Worker...');
            navigator.serviceWorker.controller.postMessage({
              type: 'NOTIFICATION',
              title: title,
              options: {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                requireInteraction: true,
                ...options
              }
            });
            console.log('Notificação enviada via Service Worker');
            return true;
          } catch (swError) {
            console.log('Erro ao usar Service Worker:', swError);
          }
        }
        
        // Fallback: tentar notificação direta (desktop)
        if (typeof window !== 'undefined' && window.Notification) {
          try {
            const notification = new Notification(title, {
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              ...options
            });
            
            notification.onclick = () => {
              console.log('Notificação clicada');
              window.focus();
              notification.close();
            };
            
            console.log('Notificação criada com sucesso');
            return true;
          } catch (notificationError) {
            console.log('Erro ao criar notificação direta:', notificationError.message);
            
            // Fallback final: alert visual
            showVisualAlert(title, options);
            return true;
          }
        }
      } else if (Notification.permission !== 'denied') {
        console.log('Solicitando permissão...');
        const permission = await Notification.requestPermission();
        console.log('Permissão concedida:', permission);
        if (permission === 'granted') {
          return await sendSystemNotification(title, options);
        } else {
          alert('Permissão de notificação negada');
        }
      } else {
        alert('Permissão de notificação foi negada anteriormente');
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao enviar notificação do sistema:', error);
      
      // Fallback: alert visual
      showVisualAlert(title, options);
      return false;
    }
  };

  // Função para mostrar alert visual
  const showVisualAlert = (title, options) => {
    console.log(`🔔 NOTIFICAÇÃO: ${title}`);
    if (options.body) {
      console.log(`📝 Detalhes: ${options.body}`);
    }
    
    // Mostrar alert visual no dashboard
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 300px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    alertDiv.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">${title}</div>
      <div style="font-size: 0.9rem;">${options.body || ''}</div>
    `;
    document.body.appendChild(alertDiv);
    
    // Remover após 5 segundos
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 5000);
  };

  // Solicitar permissão para notificações do sistema
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  return (
    <div className="dashboard">
      <audio ref={audioRef} preload="auto">
        <source src="/alert.mp3" type="audio/mpeg" />
      </audio>

      <div className="container">
        <header className="header">
          <h1>👶 Monitor de Bebé - ESP32 BLE</h1>
          <p>Sistema de monitorização com ESP32 e Bluetooth Low Energy</p>
        </header>

        <div className="status-bar">
          <div className="connection-status">
            <div className={`status-indicator ${isBluetoothConnected ? 'connected' : 'disconnected'}`}></div>
            <span>{isBluetoothConnected ? 'ESP32 Conectado' : 'ESP32 Desconectado'}</span>
          </div>
          
          <div className="controls">
            {!isBluetoothConnected ? (
              <button 
                className="btn btn-primary"
                onClick={scanForDevices}
                disabled={isScanning}
              >
                <Bluetooth size={16} />
                {isScanning ? 'A Procurar...' : 'Procurar ESP32'}
              </button>
            ) : (
              <>
                <button 
                  className="btn btn-primary"
                  onClick={isMonitoring ? stopMonitoring : startMonitoring}
                  disabled={!isBluetoothConnected}
                >
                  {isMonitoring ? <Pause size={16} /> : <Play size={16} />}
                  {isMonitoring ? 'Parar' : 'Iniciar'} Monitorização
                </button>
                
                <button 
                  className="btn btn-secondary"
                  disabled={true}
                  title="LED controlado automaticamente pelo ESP32"
                >
                  <Lightbulb size={16} />
                  LED (Automático)
                </button>
                
                <button 
                  className="btn btn-secondary"
                  onClick={disconnectESP32}
                >
                  <BluetoothConnected size={16} />
                  Desconectar
                </button>
                
                {/* Botões de Notificação */}
                <div className="notification-controls" style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-info"
                    onClick={() => sendInfoNotification('Notificação de informação do dashboard')}
                    disabled={!notificationCharacteristic}
                    title="Enviar notificação de informação"
                  >
                    📢 Info
                  </button>
                  
                  <button 
                    className="btn btn-warning"
                    onClick={() => sendWarningNotification('⚠️ Alerta: Verificar sistema')}
                    disabled={!notificationCharacteristic}
                    title="Enviar alerta"
                  >
                    ⚠️ Alerta
                  </button>
                  
                  <button 
                    className="btn btn-success"
                    onClick={() => sendSuccessNotification('✅ Sistema funcionando perfeitamente')}
                    disabled={!notificationCharacteristic}
                    title="Enviar notificação de sucesso"
                  >
                    ✅ Sucesso
                  </button>
                  
                  <button 
                    className="btn btn-danger"
                    onClick={() => sendAlertNotification('🚨 ALERTA CRÍTICO: Ação necessária!')}
                    disabled={!notificationCharacteristic}
                    title="Enviar alerta crítico"
                  >
                    🚨 Crítico
                  </button>
                </div>
              </>
            )}
            
            <button 
              className="btn btn-secondary"
              onClick={clearHistory}
            >
              <RotateCcw size={16} />
              Limpar Histórico
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={requestNotificationPermission}
              title="Permitir notificações do sistema"
            >
              🔔 Notificações
            </button>
            
            <button 
              className="btn btn-info"
              onClick={() => sendSystemNotification('🧪 Teste de Notificação', {
                body: 'Esta é uma notificação de teste do sistema!',
                tag: 'test-notification'
              })}
              title="Testar notificação do sistema"
            >
              🧪 Testar
            </button>
            
            <button 
              className="btn btn-warning"
              onClick={() => {
                console.log('Testando notificação de LED...');
                sendSystemNotification('🚨 LED LIGADO! (TESTE)', {
                  body: `Potenciômetro: ${sensorData.potenciometro} (Limite: ${settings.limitePotenciometro})`,
                  tag: 'led-alert-test',
                  requireInteraction: true
                });
              }}
              title="Testar notificação de LED"
            >
              🚨 Teste LED
            </button>
            
            <button 
              className={`btn ${settings.notificacaoSempre ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => {
                setSettings(prev => ({
                  ...prev,
                  notificacaoSempre: !prev.notificacaoSempre
                }));
                console.log('Notificação sempre:', !settings.notificacaoSempre);
              }}
              title={settings.notificacaoSempre ? 'Desativar notificações contínuas' : 'Ativar notificações contínuas'}
            >
              {settings.notificacaoSempre ? '🔔 Sempre' : '🔕 Só Mudança'}
            </button>
          </div>
        </div>

        <AlertBanner alerts={alerts} onDismiss={dismissAlert} />

      {/* Pop-up do LED */}
      {showLedPopup && (
        <div className="led-popup-overlay">
          <div className="led-popup">
            <div className="led-popup-header">
              <h3>🚨 Alerta LED</h3>
              <button 
                className="led-popup-close"
                onClick={() => setShowLedPopup(false)}
              >
                ✕
              </button>
            </div>
            <div className="led-popup-content">
              <p>{ledPopupMessage}</p>
              <div className="led-popup-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowLedPopup(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Lista de Dispositivos ESP32 */}
        {showDeviceList && (
          <div className="device-modal">
            <div className="device-modal-content">
              <div className="device-modal-header">
                <h3>Selecionar Dispositivo ESP32</h3>
                <button 
                  className="btn btn-secondary"
                  onClick={closeDeviceList}
                >
                  ✕
                </button>
              </div>
              
              <div style={{ padding: '15px 25px', background: '#f0f9ff', borderBottom: '1px solid #0ea5e9' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#0c4a6e' }}>
                  🔍 <strong>Procurando ESP32:</strong> Certifique-se de que o ESP32 está ligado e em modo BLE
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#0369a1' }}>
                  💡 <strong>Dica:</strong> O ESP32 deve aparecer como "ESP32_BLE_Pot_LED" ou "ESP32"
                </p>
              </div>
              
              <div className="device-list">
                {isScanning ? (
                  <div className="scanning">
                    <Bluetooth size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                    <p>A procurar ESP32...</p>
                    <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '8px' }}>
                      Certifique-se de que o ESP32 está ligado e em modo BLE
                    </p>
                  </div>
                ) : availableDevices.length === 0 ? (
                  <div className="no-devices">
                    <Bluetooth size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                    <p>Nenhum ESP32 encontrado</p>
                    <div style={{ fontSize: '0.9rem', color: '#6b7280', textAlign: 'left', marginTop: '16px' }}>
                      <p><strong>Verifique:</strong></p>
                      <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                        <li>ESP32 está ligado e com código carregado</li>
                        <li>ESP32 está em modo BLE (não pareado)</li>
                        <li>ESP32 está próximo ao computador</li>
                        <li>Navegador tem permissão para Bluetooth</li>
                      </ul>
                      <p style={{ marginTop: '12px', fontSize: '0.8rem', color: '#dc2626' }}>
                        <strong>Importante:</strong> Use Chrome ou Edge para Web Bluetooth API
                      </p>
                    </div>
                  </div>
                ) : (
                  availableDevices.map((device) => (
                    <div 
                      key={device.id}
                      className="device-item"
                      onClick={() => connectToESP32(device)}
                    >
                      <div className="device-info">
                        <Bluetooth size={20} style={{ color: '#3b82f6' }} />
                        <div>
                          <div className="device-name">{device.name}</div>
                          <div className="device-type">{device.type}</div>
                        </div>
                      </div>
                      <button className="btn btn-primary">
                        Conectar
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              <div className="device-modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={closeDeviceList}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Diagnóstico */}
        <div className="device-section">
          <div className="device-section-header">
            <h3>🔧 Diagnóstico do Problema</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                Verificação de Conectividade
              </span>
            </div>
          </div>
          
          <div className="connection-info">
            <div className="info-card">
              <h4>📱 Verificar ESP32</h4>
              <ol>
                <li><strong>ESP32 ligado</strong> com código carregado</li>
                <li><strong>Serial Monitor</strong> mostra "BLE ativo. Aguardando conexão..."</li>
                <li><strong>LED pisca</strong> ou fica ligado (indica BLE ativo)</li>
                <li><strong>Não pareado</strong> com outros dispositivos</li>
                <li><strong>Próximo</strong> ao computador (máximo 1 metro)</li>
              </ol>
            </div>
            
            <div className="info-card">
              <h4>💻 Verificar Computador</h4>
              <ol>
                <li><strong>Chrome ou Edge</strong> (não Firefox/Safari)</li>
                <li><strong>Bluetooth ligado</strong> no sistema</li>
                <li><strong>Permissões</strong> para o site aceder ao Bluetooth</li>
                <li><strong>HTTPS ou localhost</strong> (requisito de segurança)</li>
                <li><strong>Console aberto</strong> (F12) para ver logs</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Informações de Conexão */}
        {!isBluetoothConnected && (
          <div className="device-section">
            <div className="device-section-header">
              <h3>Conexão ESP32 BLE</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                  Bluetooth Low Energy
                </span>
              </div>
            </div>
            
            <div className="connection-info">
              <div className="info-card">
                <h4>📡 Como Conectar</h4>
                <ol>
                  <li>Certifique-se de que o ESP32 está ligado</li>
                  <li>Clique em "Procurar ESP32" para ver dispositivos disponíveis</li>
                  <li>Selecione o seu ESP32 na lista</li>
                  <li>Clique em "Conectar" para estabelecer a ligação BLE</li>
                </ol>
              </div>
              
              <div className="info-card">
                <h4>⚙️ Configuração ESP32</h4>
                <ul>
                  <li><strong>Protocolo:</strong> Bluetooth Low Energy (BLE)</li>
                  <li><strong>Nome:</strong> ESP32_BLE_Pot_LED</li>
                  <li><strong>Serviço:</strong> 4fafc201-1fb5-459e-8fcc-c5c9c331914b</li>
                  <li><strong>Potenciômetro:</strong> beb5483e-36e1-4688-b7f5-ea07361b26a8</li>
                  <li><strong>LED:</strong> Controlado automaticamente (pino 2)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="sensor-grid">
                <SensorCard
                  title="Potenciômetro"
                  icon={<Activity size={24} />}
                  value={sensorData.potenciometro}
                  unit=""
                  status={sensorData.potenciometro > settings.limitePotenciometro ? 'alert' : 'normal'}
                  timestamp={new Date(sensorData.timestamp).toLocaleTimeString()}
                  limite={settings.limitePotenciometro} // 2000 - Limite do LED ESP32
                  maxValue={4095}
                  color="#3b82f6"
                />
          
          <SensorCard
            title="Temperatura"
            icon={<Thermometer size={24} />}
            value={sensorData.temperatura}
            unit="°C"
            status={sensorData.temperatura > 30 ? 'alert' : sensorData.temperatura > 25 ? 'warning' : 'normal'}
            timestamp={new Date(sensorData.timestamp).toLocaleTimeString()}
            limite="30°C"
            maxValue="50°C"
            color={sensorData.temperatura > 30 ? "#ef4444" : sensorData.temperatura > 25 ? "#f59e0b" : "#10b981"}
          />

          <SensorCard
            title="Humidade"
            icon={<Droplets size={24} />}
            value={sensorData.humidade}
            unit="%"
            status={sensorData.humidade > 80 ? 'alert' : sensorData.humidade > 60 ? 'warning' : 'normal'}
            timestamp={new Date(sensorData.timestamp).toLocaleTimeString()}
            limite="80%"
            maxValue="100%"
            color={sensorData.humidade > 80 ? "#ef4444" : sensorData.humidade > 60 ? "#f59e0b" : "#3b82f6"}
          />
          
          <SensorCard
            title="LED Status"
            icon={<Lightbulb size={24} />}
            value={sensorData.potenciometro > settings.limitePotenciometro ? 'Ligado' : 'Desligado'}
            unit=""
            status={sensorData.potenciometro > settings.limitePotenciometro ? 'alert' : 'normal'}
            timestamp={new Date(sensorData.timestamp).toLocaleTimeString()}
            limite="2000 (Automático)" // Limite do LED ESP32
            maxValue="N/A"
            color={sensorData.potenciometro > settings.limitePotenciometro ? "#10b981" : "#6b7280"}
          />
        </div>

        <div className="charts-section">
          <Chart 
            data={history} 
            title="Histórico dos Sensores"
            height={300}
          />
        </div>

        <div className="history-section">
          <HistoryList 
            history={history} 
            onClear={clearHistory}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
