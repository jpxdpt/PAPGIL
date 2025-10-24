@echo off
echo 🚀 Iniciando Dashboard ESP32 para Mobile...
echo.

echo 📱 Descobrindo IP do computador...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%i
    goto :found
)
:found
echo ✅ IP encontrado: %IP%
echo.

echo 🌐 Iniciando servidor...
echo 📱 Aceda no telemóvel: http://%IP%:3001
echo.

npm start

