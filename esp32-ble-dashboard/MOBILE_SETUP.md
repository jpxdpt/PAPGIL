# 📱 Como Usar no Telemóvel

## 🚀 **Método 1: Acesso Web Direto (Mais Simples)**

### **Passo 1: Descobrir IP do Computador**
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
```
**Procure por:** `IPv4 Address` (ex: 192.168.1.100)

### **Passo 2: Aceder no Telemóvel**
1. **Conectar** telemóvel à **mesma rede WiFi** do computador
2. **Abrir navegador** no telemóvel
3. **Digitar:** `http://192.168.1.100:3001`
4. **Permitir** acesso ao Bluetooth quando solicitado

---

## 🏗️ **Método 2: Build para Produção (Recomendado)**

### **Passo 1: Instalar Dependências**
```bash
npm install express
```

### **Passo 2: Fazer Build**
```bash
npm run build
```

### **Passo 3: Servir Aplicação**
```bash
node serve-mobile.js
```

### **Passo 4: Aceder no Telemóvel**
- **URL:** `http://[SEU_IP]:8080`
- **Exemplo:** `http://192.168.1.100:8080`

---

## 📱 **Requisitos do Telemóvel**

### **Navegadores Suportados**
- ✅ **Chrome** (Android/iOS)
- ✅ **Edge** (Android/iOS)
- ❌ **Safari** (iOS) - Limitado
- ❌ **Firefox** - Não suporta Web Bluetooth

### **Funcionalidades Necessárias**
- ✅ **Bluetooth** ligado
- ✅ **Localização** ativada (para Bluetooth)
- ✅ **Permissões** para o site aceder ao Bluetooth

---

## 🔧 **Troubleshooting**

### **Problema: Não Conecta**
1. **Verificar** se está na mesma rede WiFi
2. **Verificar** se o IP está correto
3. **Verificar** se o servidor está a correr
4. **Tentar** `http://` em vez de `https://`

### **Problema: Bluetooth Não Funciona**
1. **Usar Chrome** ou Edge
2. **Ativar** Bluetooth e Localização
3. **Permitir** acesso ao Bluetooth
4. **Verificar** se ESP32 está próximo

### **Problema: Site Não Carrega**
1. **Verificar** firewall do computador
2. **Verificar** se porta está aberta
3. **Tentar** reiniciar o servidor

---

## 🎯 **Comandos Rápidos**

### **Desenvolvimento (localhost)**
```bash
npm start
# Aceder: http://localhost:3001
```

### **Produção (Rede)**
```bash
npm run build
node serve-mobile.js
# Aceder: http://[SEU_IP]:8080
```

### **Descobrir IP**
```bash
# Windows
ipconfig | findstr IPv4

# Linux/Mac
ifconfig | grep inet
```

---

## 📋 **Checklist Mobile**

- [ ] Computador e telemóvel na mesma WiFi
- [ ] IP do computador descoberto
- [ ] Servidor a correr
- [ ] Chrome/Edge no telemóvel
- [ ] Bluetooth ativado no telemóvel
- [ ] ESP32 próximo ao telemóvel
- [ ] Permissões Bluetooth concedidas

---

## 🚀 **Próximos Passos**

1. **Testar** no telemóvel
2. **Configurar** ESP32 próximo
3. **Ajustar** interface se necessário
4. **Otimizar** para touch screen
5. **Adicionar** PWA (Progressive Web App)

---

## 💡 **Dicas**

- **Use Chrome** no telemóvel para melhor compatibilidade
- **Mantenha ESP32 próximo** (1-2 metros)
- **Teste primeiro** no computador
- **Verifique permissões** do navegador
- **Use HTTPS** se possível (mais seguro)

