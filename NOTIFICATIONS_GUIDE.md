# 📢 Sistema de Notificações Bluetooth - Guia Completo

## 🎯 **Funcionalidade Implementada**

O dashboard agora pode enviar notificações para o ESP32 via Bluetooth, permitindo comunicação bidirecional!

## 🔧 **Como Funciona**

### **1. Dashboard → ESP32**
- ✅ **Envio de notificações** do dashboard para o ESP32
- ✅ **4 tipos** de notificação (Info, Alerta, Sucesso, Crítico)
- ✅ **Feedback visual** no ESP32 (LED pisca conforme tipo)
- ✅ **Logs** no Serial Monitor do ESP32

### **2. ESP32 → Dashboard**
- ✅ **Dados do potenciômetro** em tempo real
- ✅ **Status do LED** automático
- ✅ **Alertas** quando LED liga

## 🚀 **Como Usar**

### **1. Carregar Código ESP32**
```cpp
// Use o ficheiro: arduino_baby_monitor_with_notifications.ino
// Este código inclui suporte completo a notificações
```

### **2. Conectar Dashboard**
1. **Abrir** dashboard em `http://localhost:3000`
2. **Clicar** "🔍 Procurar ESP32"
3. **Conectar** ao ESP32
4. **Ver** botões de notificação aparecer

### **3. Enviar Notificações**
- 📢 **Info** - LED pisca 1 vez
- ⚠️ **Alerta** - LED pisca 3 vezes
- ✅ **Sucesso** - LED pisca 2 vezes
- 🚨 **Crítico** - LED pisca 10 vezes rapidamente

## 📱 **Interface do Dashboard**

### **Botões de Notificação**
```
📢 Info     ⚠️ Alerta    ✅ Sucesso    🚨 Crítico
```

### **Funcionalidades**
- ✅ **Botões ativos** apenas quando conectado
- ✅ **Feedback visual** no ESP32
- ✅ **Logs** no console do dashboard
- ✅ **Mensagens personalizadas**

## 🔧 **Código ESP32 Atualizado**

### **Novas Características**
```cpp
// UUID para notificações
#define NOTIFICATION_CHAR_UUID "c0ffee01-1234-5678-9abc-def012345678"

// Característica de notificação (WRITE)
notificationCharacteristic = pService->createCharacteristic(
  NOTIFICATION_CHAR_UUID,
  BLECharacteristic::PROPERTY_WRITE
);
```

### **Processamento de Notificações**
```cpp
class NotificationCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    // Processar notificação JSON
    // Diferentes padrões de LED conforme tipo
  }
};
```

## 📊 **Tipos de Notificação**

### **1. Info (📢)**
- **LED**: Pisca 1 vez (500ms)
- **Uso**: Informações gerais
- **Exemplo**: "Sistema funcionando"

### **2. Alerta (⚠️)**
- **LED**: Pisca 3 vezes (200ms cada)
- **Uso**: Avisos importantes
- **Exemplo**: "Verificar sistema"

### **3. Sucesso (✅)**
- **LED**: Pisca 2 vezes (300ms cada)
- **Uso**: Confirmações positivas
- **Exemplo**: "Operação concluída"

### **4. Crítico (🚨)**
- **LED**: Pisca 10 vezes rapidamente (100ms cada)
- **Uso**: Emergências
- **Exemplo**: "Ação necessária!"

## 🎯 **Casos de Uso**

### **Monitorização de Bebé**
- 📢 **Info**: "Bebé dormindo normalmente"
- ⚠️ **Alerta**: "Movimento detectado"
- ✅ **Sucesso**: "Sistema calibrado"
- 🚨 **Crítico**: "SENSOR DESCONECTADO!"

### **Sistema Industrial**
- 📢 **Info**: "Produção em andamento"
- ⚠️ **Alerta**: "Temperatura elevada"
- ✅ **Sucesso**: "Manutenção concluída"
- 🚨 **Crítico**: "FALHA CRÍTICA!"

## 🔧 **Personalização**

### **Mensagens Personalizadas**
```javascript
// No dashboard, pode personalizar as mensagens:
sendInfoNotification('Sua mensagem personalizada');
sendWarningNotification('Alerta personalizado');
sendSuccessNotification('Sucesso personalizado');
sendAlertNotification('CRÍTICO personalizado');
```

### **Padrões de LED Personalizados**
```cpp
// No ESP32, pode modificar os padrões:
if (notificationStr.indexOf("\"type\":\"alert\"") >= 0) {
  // Seu padrão personalizado aqui
}
```

## 🚀 **Vantagens**

### **Comunicação Bidirecional**
- ✅ **Dashboard → ESP32**: Notificações
- ✅ **ESP32 → Dashboard**: Dados sensores
- ✅ **Feedback visual** imediato
- ✅ **Logs** completos

### **Flexibilidade**
- ✅ **4 tipos** de notificação
- ✅ **Mensagens personalizadas**
- ✅ **Padrões de LED** configuráveis
- ✅ **JSON** para dados estruturados

## 🎉 **Resultado Final**

Agora tem um sistema completo de monitorização com:
- 📊 **Dados em tempo real** do ESP32
- 📢 **Notificações** do dashboard para ESP32
- 💡 **Feedback visual** no hardware
- 🔄 **Comunicação bidirecional**

O sistema está pronto para uso em monitorização de bebés, sistemas industriais, ou qualquer aplicação que precise de comunicação Bluetooth bidirecional! 🚀
