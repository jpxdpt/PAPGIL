const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Servir arquivos estáticos do build
app.use(express.static(path.join(__dirname, 'build')));

// Rota para todas as páginas (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando em:`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Rede: http://[SEU_IP]:${PORT}`);
  console.log(`📱 Acesse no telemóvel: http://[SEU_IP]:${PORT}`);
});

