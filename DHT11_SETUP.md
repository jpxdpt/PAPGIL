# Guia de Configuração do Sensor DHT11

## 📋 Visão Geral
Este guia explica como configurar o sensor DHT11 para monitorização de temperatura e humidade no sistema ESP32 Baby Monitor.

## 🔌 Ligação do Sensor DHT11

### Pinagem ESP32
```
DHT11    →    ESP32
VCC      →    3.3V ou 5V
GND      →    GND
DATA     →    GPIO 4
```

### Esquema de Ligação
```
ESP32          DHT11
GPIO 4    →    DATA
3.3V      →    VCC
GND       →    GND
```

## 📦 Dependências Arduino

### 1. Instalar Biblioteca DHT
No Arduino IDE:
1. Vá para **Tools** → **Manage Libraries**
2. Procure por "DHT sensor library"
3. Instale a biblioteca **"DHT sensor library"** por Adafruit
4. Instale também **"Adafruit Unified Sensor"** (dependência)

### 2. Verificar Instalação
```cpp
#include <DHT.h>
#include <DHT_U.h>
```

## 🔧 Configuração do Código

### Pinos Definidos
```cpp
#define DHTPIN 4        // Pino de dados do DHT11
#define DHTTYPE DHT11   // Tipo de sensor
```

### Inicialização
```cpp
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  dht.begin();
}
```

### Leitura de Dados
```cpp
void loop() {
  float temperatura = dht.readTemperature();
  float humidade = dht.readHumidity();
  
  // Verificar se a leitura é válida
  if (isnan(temperatura) || isnan(humidade)) {
    Serial.println("Erro ao ler DHT11!");
    return;
  }
  
  Serial.print("Temperatura: ");
  Serial.print(temperatura);
  Serial.print("°C | Humidade: ");
  Serial.print(humidade);
  Serial.println("%");
  
  delay(2000); // DHT11 precisa de pelo menos 2 segundos
}
```

## 📊 Características BLE

### UUIDs Adicionados
```cpp
#define TEMPERATURE_CHAR_UUID "d0ffee01-1234-5678-9abc-def012345678"
#define HUMIDITY_CHAR_UUID "e0ffee01-1234-5678-9abc-def012345678"
```

### Envio via BLE
```cpp
// Enviar temperatura
tempCharacteristic->setValue(String(temperatura));
tempCharacteristic->notify();

// Enviar humidade
humidityCharacteristic->setValue(String(humidade));
humidityCharacteristic->notify();
```

## 🎯 Dashboard - Novas Funcionalidades

### Cards de Sensores
- **Temperatura**: Mostra valor em °C com alertas
- **Humidade**: Mostra valor em % com alertas
- **Cores dinâmicas**: Verde (normal), Amarelo (atenção), Vermelho (alerta)

### Gráficos
- **Eixo Y esquerdo**: Potenciômetro (0-4095)
- **Eixo Y direito**: Temperatura (0-50°C)
- **Linha azul**: Humidade (0-100%)

### Alertas Automáticos
- **Temperatura > 30°C**: Alerta vermelho
- **Temperatura > 25°C**: Aviso amarelo
- **Humidade > 80%**: Alerta vermelho
- **Humidade > 60%**: Aviso amarelo

## 🔧 Resolução de Problemas

### Erro "Erro ao ler DHT11!"
1. **Verificar ligações**: VCC, GND, DATA
2. **Verificar pino**: Confirmar GPIO 4
3. **Pull-up resistor**: Adicionar resistor 4.7kΩ entre DATA e VCC
4. **Alimentação**: DHT11 pode precisar de 5V em vez de 3.3V

### Valores Inválidos
```cpp
if (isnan(temperatura) || isnan(humidade)) {
  Serial.println("Erro ao ler DHT11!");
  temperatura = 0;
  humidade = 0;
}
```

### Timing
- **Delay mínimo**: 2 segundos entre leituras
- **Primeira leitura**: Pode falhar, ignorar

## 📱 Teste no Dashboard

### 1. Conectar ESP32
- Carregar código atualizado
- Conectar via Bluetooth
- Verificar dados no dashboard

### 2. Verificar Dados
- **Temperatura**: Deve mostrar valores reais
- **Humidade**: Deve mostrar valores reais
- **Gráficos**: Devem mostrar linhas de temperatura e humidade

### 3. Testar Alertas
- **Temperatura alta**: Soprar no sensor
- **Humidade alta**: Colocar gota de água no sensor

## 🎨 Personalização

### Limites de Alerta
```javascript
// No Dashboard.js
status={sensorData.temperatura > 30 ? 'alert' : sensorData.temperatura > 25 ? 'warning' : 'normal'}
status={sensorData.humidade > 80 ? 'alert' : sensorData.humidade > 60 ? 'warning' : 'normal'}
```

### Cores dos Cards
```javascript
color={sensorData.temperatura > 30 ? "#ef4444" : sensorData.temperatura > 25 ? "#f59e0b" : "#10b981"}
color={sensorData.humidade > 80 ? "#ef4444" : sensorData.humidade > 60 ? "#f59e0b" : "#3b82f6"}
```

## ✅ Checklist de Verificação

- [ ] DHT11 ligado corretamente (VCC, GND, DATA)
- [ ] Biblioteca DHT instalada
- [ ] Código ESP32 atualizado
- [ ] Dashboard mostra temperatura e humidade
- [ ] Gráficos funcionam
- [ ] Alertas funcionam
- [ ] Histórico registra dados
- [ ] BLE envia dados corretamente

## 🚀 Próximos Passos

1. **Testar com dados reais**
2. **Ajustar limites de alerta**
3. **Personalizar cores**
4. **Adicionar mais sensores** (se necessário)
5. **Implementar notificações por temperatura/humidade**

---

**Nota**: O DHT11 tem precisão de ±2°C para temperatura e ±5% para humidade. Para maior precisão, considere usar DHT22.
