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
    botao: 0,
    som: 0,
    chorar: false,
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
  const [buttonCharacteristic, setButtonCharacteristic] = useState(null);
  const [soundCharacteristic, setSoundCharacteristic] = useState(null);
  const [soundStatusCharacteristic, setSoundStatusCharacteristic] = useState(null);
  const [temperatureCharacteristic, setTemperatureCharacteristic] = useState(null);
  const [humidityCharacteristic, setHumidityCharacteristic] = useState(null);
  const [notificationCharacteristic, setNotificationCharacteristic] = useState(null);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [settings, setSettings] = useState({
    limiteSom: 200, // Limiar para considerar "a chorar"
    alertasAtivos: true,
    notificacaoSempre: false // Notificar sempre que passar o limite
  });
  const audioRef = useRef(null);
  const lastUpdateRef = useRef(0); // evitar updates excessivos/visíveis
  const lastAlertStatesRef = useRef({
    som: false,
    temperatura: false,
    humidade: false,
    chorar: false
  }); // rastrear últimos estados de alerta para evitar notificações repetidas

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
  const BUTTON_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
  const SOUND_CHARACTERISTIC_UUID = 'f0ffee01-1234-5678-9abc-def012345678';
  const SOUND_STATUS_CHARACTERISTIC_UUID = 'f0ffee02-1234-5678-9abc-def012345678';
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

  // Função utilitária para aplicar dados com leve throttle (suavizar UI)
  const pushSensorData = (partialData) => {
    const now = Date.now();
    setSensorData(prev => {
      const merged = { ...prev, ...partialData, timestamp: now };

      // Evita re-render "tremido" se chegarem várias notificações seguidas
      if (now - lastUpdateRef.current >= 800) {
        lastUpdateRef.current = now;
        setHistory(prevHist => [
          { ...merged, id: now },
          ...prevHist.slice(0, 99)
        ]);
        checkAlerts(merged);
      }

      return merged;
    });
  };

  // Processar dados do som bruto
  const handleSoundData = (event) => {
    const dataView = event.target.value;

    let value;
    try {
      const decodedString = new TextDecoder().decode(dataView);
      value = parseInt(decodedString.trim());

      if (isNaN(value)) {
        console.warn('Valor de som inválido:', decodedString);
        return;
      }

      console.log('Som recebido:', value);
    } catch (error) {
      console.error('Erro ao decodificar som:', error);
      return;
    }

    const choroState = value >= settings.limiteSom ? true : sensorData.chorar;

    pushSensorData({
      som: value,
      chorar: choroState
    });
  };

  // Processar estado de choro (0/1) vindo do ESP32
  const handleSoundStatusData = (event) => {
    const dataView = event.target.value;

    let value;
    try {
      const decodedString = new TextDecoder().decode(dataView);
      value = parseInt(decodedString.trim());
      if (isNaN(value) || (value !== 0 && value !== 1)) {
        console.warn('Estado de som inválido:', decodedString);
        return;
      }
      console.log('Estado choro recebido:', value);
    } catch (error) {
      console.error('Erro ao decodificar estado de som:', error);
      return;
    }

    pushSensorData({
      chorar: value === 1
    });
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
      
      // Obter característica do botão (substitui potenciômetro)
      const buttonChar = await service.getCharacteristic(BUTTON_CHARACTERISTIC_UUID);
      setButtonCharacteristic(buttonChar);
      
      // Obter característica do som (valor bruto)
      const soundChar = await service.getCharacteristic(SOUND_CHARACTERISTIC_UUID);
      setSoundCharacteristic(soundChar);

      // Obter característica do estado de choro (0/1) - opcional
      let soundStatusChar = null;
      try {
        soundStatusChar = await service.getCharacteristic(SOUND_STATUS_CHARACTERISTIC_UUID);
        setSoundStatusCharacteristic(soundStatusChar);
      } catch (err) {
        console.log('Característica de estado de choro não encontrada (seguindo sem ela):', err?.message);
        setSoundStatusCharacteristic(null);
      }
      
      // Obter característica de temperatura
      const tempChar = await service.getCharacteristic(TEMPERATURE_CHARACTERISTIC_UUID);
      setTemperatureCharacteristic(tempChar);
      
      // Obter característica de humidade
      const humidityChar = await service.getCharacteristic(HUMIDITY_CHARACTERISTIC_UUID);
      setHumidityCharacteristic(humidityChar);
      
      // Configurar notificações
      await buttonChar.startNotifications();
      buttonChar.addEventListener('characteristicvaluechanged', handleButtonData);

      await soundChar.startNotifications();
      soundChar.addEventListener('characteristicvaluechanged', handleSoundData);

      if (soundStatusChar) {
        await soundStatusChar.startNotifications();
        soundStatusChar.addEventListener('characteristicvaluechanged', handleSoundStatusData);
      }
      
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
        setButtonCharacteristic(null);
        setSoundCharacteristic(null);
        setSoundStatusCharacteristic(null);
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

  // Processar dados do botão (sentado / não sentado)
  const handleButtonData = (event) => {
    const dataView = event.target.value;
    
    let value;
    try {
      const decodedString = new TextDecoder().decode(dataView);
      value = parseInt(decodedString.trim());
      
      if (isNaN(value) || (value !== 0 && value !== 1)) {
        console.warn('Valor de botão inválido:', decodedString);
        return;
      }
      
      console.log('Botão recebido:', value);
      
    } catch (error) {
      console.error('Erro ao decodificar dados do botão:', error);
      return;
    }
    
    pushSensorData({
      botao: value
    });
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
    setButtonCharacteristic(null);
    setSoundCharacteristic(null);
    setSoundStatusCharacteristic(null);
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

  // Função para tocar som de alerta (usa Web Audio API se disponível, senão tenta arquivo)
  const playAlertSound = () => {
    if (!settings.alertasAtivos) return;
    
    // Tentar usar Web Audio API para gerar beep
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequência do beep
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Erro ao gerar beep, tentando arquivo de áudio:', error);
      // Fallback: tentar arquivo de áudio se existir
      if (audioRef.current) {
        audioRef.current.play().catch(err => {
          console.log('Erro ao tocar arquivo de áudio:', err);
        });
      }
    }
  };

  const checkAlerts = (data) => {
    const newAlerts = [];
    // Som/choro só é considerado alerta se bebé estiver sentado (botão = 1)
    const currentStates = {
      som: (data.chorar || data.som >= settings.limiteSom) && data.botao === 1,
      temperatura: data.temperatura > 30,
      humidade: data.humidade > 80,
      chorar: data.chorar && data.botao === 1
    };

    // Verificar som/choro - apenas se bebé estiver sentado (botão = 1)
    if (currentStates.som && data.botao === 1) {
      const shouldAlert = !lastAlertStatesRef.current.som || settings.notificacaoSempre;
      if (shouldAlert) {
        newAlerts.push({
          id: Date.now(),
          type: 'som',
          message: data.chorar ? '🚨 Bebé a chorar detectado!' : `🔊 Som elevado detectado (${data.som})`,
          timestamp: Date.now(),
          severity: 'high'
        });
        
        // Notificação do sistema
        if (settings.alertasAtivos) {
          sendSystemNotification(
            data.chorar ? '🚨 Bebé a chorar!' : '🔊 Som elevado detectado',
            {
              body: `Valor do som: ${data.som} (Limiar: ${settings.limiteSom}) - Bebé sentado`,
              tag: 'sound-alert',
              requireInteraction: true,
              icon: '/favicon.ico'
            }
          );
        }
      }
    }

    // Verificar temperatura
    if (currentStates.temperatura) {
      const shouldAlert = !lastAlertStatesRef.current.temperatura || settings.notificacaoSempre;
      if (shouldAlert) {
        newAlerts.push({
          id: Date.now(),
          type: 'temperatura',
          message: `🌡️ Temperatura elevada: ${data.temperatura.toFixed(1)}°C`,
          timestamp: Date.now(),
          severity: 'high'
        });
        
        // Notificação do sistema
        if (settings.alertasAtivos) {
          sendSystemNotification(
            '🌡️ Temperatura elevada!',
            {
              body: `Temperatura: ${data.temperatura.toFixed(1)}°C (Limite: 30°C)`,
              tag: 'temperature-alert',
              requireInteraction: true,
              icon: '/favicon.ico'
            }
          );
        }
      }
    }

    // Verificar humidade
    if (currentStates.humidade) {
      const shouldAlert = !lastAlertStatesRef.current.humidade || settings.notificacaoSempre;
      if (shouldAlert) {
        newAlerts.push({
          id: Date.now(),
          type: 'humidade',
          message: `💧 Humidade elevada: ${data.humidade.toFixed(1)}%`,
          timestamp: Date.now(),
          severity: 'high'
        });
        
        // Notificação do sistema
        if (settings.alertasAtivos) {
          sendSystemNotification(
            '💧 Humidade elevada!',
            {
              body: `Humidade: ${data.humidade.toFixed(1)}% (Limite: 80%)`,
              tag: 'humidity-alert',
              requireInteraction: true,
              icon: '/favicon.ico'
            }
          );
        }
      }
    }
    
    // Atualizar estados de alerta
    lastAlertStatesRef.current = currentStates;
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 4)]);
      
      // Tocar som de alerta
      playAlertSound();
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
                sendSystemNotification('🧪 Teste: Som Alto', {
                  body: `Som: ${sensorData.som} (Limiar: ${settings.limiteSom})`,
                  tag: 'sound-alert-test',
                  requireInteraction: true
                });
              }}
              title="Testar notificação de som"
            >
              🔊 Teste Som
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
                  <li><strong>Nome:</strong> ESP32_BLE_Botao_Som_LED</li>
                  <li><strong>Serviço:</strong> 4fafc201-1fb5-459e-8fcc-c5c9c331914b</li>
                  <li><strong>Botão:</strong> beb5483e-36e1-4688-b7f5-ea07361b26a8</li>
                  <li><strong>Som (bruto):</strong> f0ffee01-1234-5678-9abc-def012345678</li>
                  <li><strong>Choro (0/1):</strong> f0ffee02-1234-5678-9abc-def012345678</li>
                  <li><strong>DHT11:</strong> Temp d0ffee01..., Hum e0ffee01...</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="sensor-grid">
          <SensorCard
            title="Posição (Botão)"
            icon={<Activity size={24} />}
            value={sensorData.botao === 1 ? 'Sentado' : 'Não sentado'}
            unit=""
            status={sensorData.botao === 1 ? 'normal' : 'warning'}
            timestamp={new Date(sensorData.timestamp).toLocaleTimeString()}
            limite="1 = sentado"
            maxValue="1"
            color={sensorData.botao === 1 ? "#10b981" : "#f59e0b"}
          />

          <SensorCard
            title="Som (bruto)"
            icon={<AlertTriangle size={24} />}
            value={sensorData.som}
            unit=""
            status={sensorData.som >= settings.limiteSom ? 'alert' : 'normal'}
            timestamp={new Date(sensorData.timestamp).toLocaleTimeString()}
            limite={settings.limiteSom}
            maxValue="4095"
            color={sensorData.som >= settings.limiteSom ? "#ef4444" : "#3b82f6"}
          />

          <SensorCard
            title="Estado: Choro"
            icon={<AlertTriangle size={24} />}
            value={sensorData.chorar ? 'A chorar' : 'Calmo'}
            unit=""
            status={sensorData.chorar ? 'alert' : 'normal'}
            timestamp={new Date(sensorData.timestamp).toLocaleTimeString()}
            limite={settings.limiteSom}
            maxValue="4095"
            color={sensorData.chorar ? "#ef4444" : "#10b981"}
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
