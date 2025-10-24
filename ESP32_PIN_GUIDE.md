# 🔌 Guia de Pinagem ESP32 - Pinos Seguros

## ⚠️ **PINOS QUE NÃO DEVEM SER USADOS**

### **Pinos Reservados do Sistema**
```
GPIO 0  - BOOT (pode causar problemas no boot)
GPIO 1  - TX0 (Serial Debug)
GPIO 3  - RX0 (Serial Debug)
GPIO 6  - SPI Flash (reservado)
GPIO 7  - SPI Flash (reservado)
GPIO 8  - SPI Flash (reservado)
GPIO 9  - SPI Flash (reservado)
GPIO 10 - SPI Flash (reservado)
GPIO 11 - SPI Flash (reservado)
GPIO 16 - SPI Flash (reservado)
GPIO 17 - SPI Flash (reservado)
```

### **Pinos de Alimentação**
```
GPIO 2  - LED Built-in (pode interferir)
GPIO 5  - Boot (pode causar problemas)
GPIO 12 - Boot (pode causar problemas)
GPIO 15 - Boot (pode causar problemas)
```

## ✅ **PINOS SEGUROS PARA USAR**

### **Pinos Digitais Seguros**
```
GPIO 4  - ✅ SEGURO (DHT11)
GPIO 13 - ✅ SEGURO
GPIO 14 - ✅ SEGURO
GPIO 18 - ✅ SEGURO
GPIO 19 - ✅ SEGURO
GPIO 21 - ✅ SEGURO
GPIO 22 - ✅ SEGURO
GPIO 23 - ✅ SEGURO
GPIO 25 - ✅ SEGURO
GPIO 26 - ✅ SEGURO
GPIO 27 - ✅ SEGURO
GPIO 32 - ✅ SEGURO
GPIO 33 - ✅ SEGURO
```

### **Pinos Analógicos**
```
GPIO 34 - ✅ ADC1_CH6 (Potenciômetro)
GPIO 35 - ✅ ADC1_CH7
GPIO 36 - ✅ ADC1_CH0
GPIO 39 - ✅ ADC1_CH3
```

## 🔧 **Configuração Atual do Projeto**

### **Pinos em Uso**
```cpp
#define potenciometroPin 34  // ✅ ADC seguro
#define pinoLED 2            // ⚠️ LED built-in (pode interferir)
#define DHTPIN 4            // ✅ GPIO seguro
```

### **Recomendação de Alteração**
Se o GPIO 2 estiver a causar problemas, mude para:
```cpp
#define pinoLED 13  // ✅ GPIO 13 é mais seguro
```

## 🚨 **Problemas Comuns**

### **GPIO 2 (LED Built-in)**
- **Problema**: Pode interferir com boot
- **Solução**: Usar GPIO 13, 18, 19, 21, 22, 23

### **GPIO 4 (DHT11)**
- **Problema**: Pode ter conflitos com outros sensores
- **Solução**: GPIO 4 é seguro, mas pode testar GPIO 13

### **GPIO 34 (Potenciômetro)**
- **Problema**: Apenas entrada (não pode ser OUTPUT)
- **Solução**: GPIO 34 é correto para ADC

## 🔄 **Código Atualizado Recomendado**

```cpp
// Pinos seguros
#define potenciometroPin 34  // ADC seguro
#define pinoLED 13          // GPIO seguro (mudança recomendada)
#define DHTPIN 4           // GPIO seguro
#define DHTTYPE DHT11

// Se GPIO 4 der problemas, usar:
// #define DHTPIN 13
```

## 📋 **Checklist de Verificação**

- [ ] **GPIO 2**: Mudar para GPIO 13 se houver problemas
- [ ] **GPIO 4**: Verificar se DHT11 está bem ligado
- [ ] **GPIO 34**: Confirmar que é entrada analógica
- [ ] **Alimentação**: 3.3V para DHT11
- [ ] **Pull-up**: Resistor 4.7kΩ no DHT11 (se necessário)

## 🛠️ **Resolução de Problemas**

### **Erro de Compilação**
1. **Verificar bibliotecas**: DHT, ArduinoJson
2. **Verificar pinos**: Não usar pinos reservados
3. **Verificar ligações**: VCC, GND, DATA

### **Erro de Upload**
1. **GPIO 0**: Não ligar nada durante upload
2. **GPIO 2**: Pode interferir com boot
3. **Reset**: Pressionar botão RESET se necessário

### **Dados Incorretos**
1. **DHT11**: Verificar ligações e alimentação
2. **Potenciômetro**: Verificar se está no ADC correto
3. **LED**: Verificar se GPIO 2 não interfere

## 🎯 **Configuração Final Recomendada**

```cpp
// Pinos otimizados
#define potenciometroPin 34  // ADC1_CH6
#define pinoLED 13          // GPIO seguro
#define DHTPIN 4           // GPIO seguro
#define DHTTYPE DHT11

// Ligação recomendada:
// DHT11: VCC→3.3V, GND→GND, DATA→GPIO4
// Potenciômetro: VCC→3.3V, GND→GND, OUT→GPIO34
// LED: Anodo→GPIO13, Catodo→GND (com resistor 220Ω)
```

---

**Nota**: Se continuar com problemas, tente mudar o LED para GPIO 13 e o DHT11 para GPIO 13 também.
