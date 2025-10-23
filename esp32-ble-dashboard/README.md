# 👶 Monitor de Bebé - ESP32 BLE Dashboard

Dashboard web para monitorização de bebés com ESP32 usando Bluetooth Low Energy (BLE) e Web Bluetooth API.

## 🚀 **Solução Simplificada - Apenas React!**

### **Por que Não Precisa do Electron?**
- ✅ **Web Bluetooth API** funciona perfeitamente com ESP32
- ✅ **Comunicação Direta** - Navegador ↔ ESP32
- ✅ **Sem Servidor** - Tudo no frontend React
- ✅ **Multiplataforma** - Funciona em qualquer SO

## 📦 **Instalação e Execução**

### **1. Instalar Dependências**
```bash
npm install
```

### **2. Executar Aplicação**
```bash
npm start
```

### **3. Abrir no Navegador**
- A aplicação abre automaticamente em `http://localhost:3000`
- **Importante**: Use **Chrome** ou **Edge** para Web Bluetooth API

## 🔧 **Como Funciona**

### **Comunicação ESP32 BLE**
- **Web Bluetooth API** - Comunicação direta do navegador
- **Sem Servidor** - Comunicação direta frontend ↔ ESP32
- **Tempo Real** - Notificações BLE para dados do potenciômetro
- **Controle Remoto** - Comandos PWM para LED via BLE

### **Fluxo de Dados**
```
ESP32 → BLE → Web Bluetooth API → React Dashboard
```

## 📱 **Como Usar**

### **1. Preparar ESP32**
1. **Ligar ESP32** com código BLE carregado
2. **Verificar BLE** - ESP32 deve aparecer como "ESP32" ou "Baby Monitor"
3. **Aguardar** - ESP32 deve estar em modo BLE ativo

### **2. Conectar na Aplicação**
1. **Procurar ESP32** - Clique para ver dispositivos BLE disponíveis
2. **Selecionar ESP32** - Escolha o seu ESP32 na lista
3. **Conectar** - Clique em "Conectar" para estabelecer ligação BLE

### **3. Monitorizar e Controlar**
1. **Iniciar Monitorização** - Clique no botão play
2. **Ver Dados** - Valores reais do potenciômetro via BLE
3. **Controlar LED** - Botão para ligar/desligar LED remotamente
4. **Alertas** - Notificações para valores críticos

## 🎯 **Funcionalidades**

### **Comunicação BLE**
- ✅ **Conexão Direta** - Web Bluetooth API com ESP32
- ✅ **Dados em Tempo Real** - Notificações BLE do potenciômetro
- ✅ **Controle Remoto** - Comandos PWM para LED
- ✅ **Sem Servidor** - Comunicação direta frontend ↔ ESP32
- ✅ **Multiplataforma** - Funciona em Windows, Mac, Linux

### **Interface**
- ✅ **Dados em Tempo Real** - Valores do potenciômetro atualizados
- ✅ **Controle LED** - Botão para ligar/desligar LED
- ✅ **Alertas** - Notificações para valores críticos
- ✅ **Histórico** - Gráficos e lista de dados
- ✅ **Interface Web** - Aplicação web responsiva

## 🔧 **Configuração ESP32**

### **UUIDs BLE**
```cpp
// Serviço principal
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"

// Característica do potenciômetro (notificações)
#define POTENTIOMETER_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// Característica do LED (controle)
#define LED_CHARACTERISTIC_UUID "11111111-2222-3333-4444-555555555555"
```

### **Código ESP32 BLE**
```cpp
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>

#define potenciometroPin 34
#define pinoLED 2

#define SERVICE_UUID            "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define POTENTIOMETER_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLECharacteristic *potCharacteristic;

bool dispositivoConectado = false;
int valorPot = 0;
const int limite = 200;

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    dispositivoConectado = true;
    Serial.println("Dashboard BLE conectada!");
  }
  void onDisconnect(BLEServer* pServer) {
    dispositivoConectado = false;
    Serial.println("Dashboard desconectada.");
  }
};

void setup() {
  Serial.begin(115200);
  pinMode(potenciometroPin, INPUT);
  pinMode(pinoLED, OUTPUT);

  BLEDevice::init("ESP32_BLE_Pot_LED");
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  potCharacteristic = pService->createCharacteristic(
    POTENTIOMETER_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  potCharacteristic->addDescriptor(new BLE2902());

  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  BLEDevice::startAdvertising();

  Serial.println("BLE ativo. Aguardando conexão...");
}

void loop() {
  valorPot = analogRead(potenciometroPin);

  if (valorPot > limite) {
    digitalWrite(pinoLED, HIGH);
  } else {
    digitalWrite(pinoLED, LOW);
  }

  Serial.print("Valor do potenciômetro: ");
  Serial.println(valorPot);

  if (dispositivoConectado) {
    potCharacteristic->setValue(String(valorPot));
    potCharacteristic->notify();
  }

  delay(200);
}
```

## 🔧 **Resolução de Problemas**

### **ESP32 não aparece na lista:**
1. Verifique se o ESP32 está ligado
2. Verifique se o código BLE está carregado
3. Verifique se o BLE está ativo
4. Reinicie a aplicação

### **Erro de conexão:**
1. Verifique se o ESP32 está em modo BLE
2. Verifique se os UUIDs estão corretos
3. Verifique se o ESP32 está próximo
4. Tente reconectar

### **Dados não chegam:**
1. Verifique se as notificações estão ativas
2. Verifique se o potenciômetro está ligado
3. Verifique se a característica está configurada
4. Verifique a conexão BLE

## 📊 **Estrutura do Projeto**

```
esp32-ble-dashboard/
├── public/
│   └── index.html          # HTML base
├── src/
│   ├── components/         # Componentes React
│   │   ├── Dashboard.js    # Dashboard principal
│   │   ├── SensorCard.js   # Cartão de sensor
│   │   ├── Chart.js        # Gráfico de dados
│   │   ├── HistoryList.js  # Lista de histórico
│   │   └── AlertBanner.js  # Banner de alertas
│   ├── App.js             # App principal
│   ├── App.css            # Estilos
│   └── index.js           # Entrada da aplicação
├── package.json           # Dependências
└── README.md             # Este arquivo
```

## 🚀 **Tecnologias Utilizadas**

- **Frontend**: React 18, Chart.js, Lucide React
- **Comunicação**: Web Bluetooth API, BLE
- **ESP32**: C++, Bluetooth Low Energy

## 💡 **Vantagens da Solução Web**

### **Simplicidade**
- ✅ **Sem Electron** - Apenas React
- ✅ **Sem Servidor** - Comunicação direta
- ✅ **Instalação Fácil** - Apenas `npm install`
- ✅ **Multiplataforma** - Funciona em qualquer SO

### **Funcionalidades**
- ✅ **Dados Reais** - Comunicação direta com ESP32
- ✅ **Controle Remoto** - LED controlado via BLE
- ✅ **Tempo Real** - Notificações BLE instantâneas
- ✅ **Interface Web** - Aplicação web responsiva

## 🎯 **Comparação com Electron**

| Aspecto | Electron | Web App |
|---------|----------|---------|
| **Instalação** | Complexa | Simples |
| **Tamanho** | Grande | Pequeno |
| **Performance** | Média | Alta |
| **Manutenção** | Complexa | Simples |
| **Deploy** | Complexo | Simples |

---

**Sistema desenvolvido para monitorização segura de bebés com ESP32 e Bluetooth Low Energy!** 👶✨
