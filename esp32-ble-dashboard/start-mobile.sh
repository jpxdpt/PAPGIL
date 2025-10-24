#!/bin/bash

echo "🚀 Iniciando Dashboard ESP32 para Mobile..."
echo

echo "📱 Descobrindo IP do computador..."
IP=$(ifconfig | grep -E "inet.*broadcast" | awk '{print $2}' | head -1)
echo "✅ IP encontrado: $IP"
echo

echo "🌐 Iniciando servidor..."
echo "📱 Aceda no telemóvel: http://$IP:3001"
echo

npm start

