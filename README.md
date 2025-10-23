# 👶 Sistema de Monitorização de Bebés - Dashboard Simples

Dashboard de monitorização de bebés que funciona **sem conectar o Arduino ao PC** - ideal para demonstração e teste.

## 🚀 Instalação Rápida

### 1. Instalar Dependências
```bash
npm install
```

### 2. Executar Dashboard
```bash
npm start
```

### 3. Aceder ao Sistema
- **Dashboard**: http://localhost:3000

## 🎯 Como Funciona

### **Modo Simulação**
- ✅ **Sem Servidor** - Funciona apenas com React
- ✅ **Sem Arduino Conectado** - Não precisa de ligar o Arduino ao PC
- ✅ **Dados Simulados** - Simula dados reais do Arduino
- ✅ **Interface Completa** - Todas as funcionalidades disponíveis

### **Funcionalidades**
- 📊 **Dados em Tempo Real** - Valores dos sensores atualizados
- 🚨 **Alertas Visuais e Sonoros** - Notificações para valores críticos
- 📈 **Histórico Completo** - Gráficos e lista dos últimos 100 registos
- 📱 **Interface Responsiva** - Funciona em desktop e mobile
- ⚙️ **Configuração Flexível** - Ajustar limites e alertas

## 🔧 Como Usar

### 1. Conectar ao HC-05
1. **Clique em "Conectar HC-05"** - Simula a conexão
2. **Sistema Conectado** - Mostra status de conexão
3. **Dados Simulados** - Recebe dados como se fosse do Arduino

### 2. Monitorizar
1. **Iniciar Monitorização** - Clique no botão play
2. **Ver Dados** - Valores em tempo real dos sensores
3. **Alertas** - Notificações quando valores ultrapassam limites
4. **Histórico** - Gráficos e lista de dados

## 🎯 Vantagens desta Solução

### **Simplicidade**
- ✅ **Um Comando** - `npm start` e está pronto
- ✅ **Sem Configuração** - Não precisa de servidor ou portas
- ✅ **Funciona Sempre** - Não depende de hardware externo
- ✅ **Fácil de Usar** - Interface intuitiva

### **Ideal Para**
- 🎓 **Demonstrações** - Mostrar funcionalidades do sistema
- 🧪 **Testes** - Testar interface e alertas
- 📱 **Protótipos** - Desenvolver e testar funcionalidades
- 👥 **Apresentações** - Mostrar o sistema a outros

## 📊 Estrutura do Projeto

```
baby-monitor-dashboard/
├── src/
│   ├── components/
│   │   ├── Dashboard.js      # Dashboard principal
│   │   ├── SensorCard.js     # Cartões dos sensores
│   │   ├── Chart.js          # Gráficos
│   │   ├── HistoryList.js    # Lista de histórico
│   │   └── AlertBanner.js    # Alertas
│   ├── App.js               # App principal
│   └── index.js            # Entrada da aplicação
├── arduino_baby_monitor.ino # Código Arduino (referência)
└── package.json            # Dependências
```

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18, Chart.js, Lucide React
- **Simulação**: Dados baseados no código Arduino
- **Interface**: Responsiva e intuitiva

## 💡 Por que Esta Solução

### **Problema Original**
- Web Bluetooth API não funciona com HC-05 (Bluetooth clássico)
- Comunicação serial requer servidor Node.js
- Conectar Arduino ao PC não é prático

### **Solução Implementada**
- ✅ **Simulação Realista** - Dados baseados no código Arduino
- ✅ **Sem Dependências** - Não precisa de servidor ou hardware
- ✅ **Funciona Sempre** - Disponível para demonstração
- ✅ **Interface Completa** - Todas as funcionalidades

## 🎯 Como Funciona a Simulação

### **Dados Simulados**
```javascript
// Simula leitura dos sensores como no Arduino
const pressao = Math.floor(Math.random() * 400) + 50; // Sensor A0
const som = Math.floor(Math.random() * 300) + 30;    // Sensor A1
```

### **Formato dos Dados**
- **Pressão**: 50-450 (simula sensor A0)
- **Som**: 30-330 (simula sensor A1)
- **Intervalo**: A cada 2 segundos (como no Arduino)
- **Alertas**: Quando valores ultrapassam limites

## 🆘 Resolução de Problemas

### **Dashboard não carrega**
1. Verifique se executou `npm install`
2. Verifique se executou `npm start`
3. Verifique se a porta 3000 está livre

### **Dados não aparecem**
1. Clique em "Conectar HC-05"
2. Clique em "Iniciar Monitorização"
3. Verifique se o status mostra "Conectado"

### **Alertas não funcionam**
1. Verifique se os valores ultrapassam os limites
2. Verifique se os alertas estão ativados
3. Verifique se o navegador permite som

---

**Sistema desenvolvido para demonstração e teste sem necessidade de hardware externo!** 👶✨