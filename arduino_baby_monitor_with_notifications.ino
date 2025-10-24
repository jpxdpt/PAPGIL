#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>

#define potenciometroPin 34
#define pinoLED 2

// UUIDs do serviço e características
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define POTENTIOMETER_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define NOTIFICATION_CHAR_UUID "c0ffee01-1234-5678-9abc-def012345678"

BLECharacteristic *potCharacteristic;
BLECharacteristic *notificationCharacteristic;
bool dispositivoConectado = false;
int valorPot = 0;
const int limite = 2000;

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    dispositivoConectado = true;
    Serial.println("Mobile conectado!");
  }
  void onDisconnect(BLEServer* pServer) {
    dispositivoConectado = false;
    Serial.println("Mobile desconectado.");
  }
};

class NotificationCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String value = pCharacteristic->getValue().c_str();
    
    if (value.length() > 0) {
      Serial.println("Notificação recebida do dashboard:");
      Serial.println(value);
      
      // Processar notificação JSON
      String notificationStr = value;
      
      // Verificar tipo de notificação
      if (notificationStr.indexOf("\"type\":\"alert\"") >= 0) {
        Serial.println("🚨 ALERTA CRÍTICO recebido!");
        // Piscar LED rapidamente para alerta crítico
        for (int i = 0; i < 10; i++) {
          digitalWrite(pinoLED, HIGH);
          delay(100);
          digitalWrite(pinoLED, LOW);
          delay(100);
        }
      } else if (notificationStr.indexOf("\"type\":\"warning\"") >= 0) {
        Serial.println("⚠️ ALERTA recebido!");
        // Piscar LED 3 vezes para alerta
        for (int i = 0; i < 3; i++) {
          digitalWrite(pinoLED, HIGH);
          delay(200);
          digitalWrite(pinoLED, LOW);
          delay(200);
        }
      } else if (notificationStr.indexOf("\"type\":\"success\"") >= 0) {
        Serial.println("✅ SUCESSO recebido!");
        // Piscar LED 2 vezes para sucesso
        for (int i = 0; i < 2; i++) {
          digitalWrite(pinoLED, HIGH);
          delay(300);
          digitalWrite(pinoLED, LOW);
          delay(300);
        }
      } else if (notificationStr.indexOf("\"type\":\"info\"") >= 0) {
        Serial.println("📢 INFORMAÇÃO recebida!");
        // Piscar LED 1 vez para informação
        digitalWrite(pinoLED, HIGH);
        delay(500);
        digitalWrite(pinoLED, LOW);
      }
    }
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

  // Característica do potenciômetro (READ + NOTIFY)
  potCharacteristic = pService->createCharacteristic(
    POTENTIOMETER_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  potCharacteristic->addDescriptor(new BLE2902());

  // Característica de notificação (WRITE)
  notificationCharacteristic = pService->createCharacteristic(
    NOTIFICATION_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  notificationCharacteristic->setCallbacks(new NotificationCallbacks());

  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  BLEDevice::startAdvertising();

  Serial.println("BLE ativo com suporte a notificações. Aguardando conexão mobile...");
  Serial.println("UUIDs:");
  Serial.println("  Serviço: " + String(SERVICE_UUID));
  Serial.println("  Potenciômetro: " + String(POTENTIOMETER_CHAR_UUID));
  Serial.println("  Notificação: " + String(NOTIFICATION_CHAR_UUID));
}

void loop() {
  valorPot = analogRead(potenciometroPin);

  // Controlo automático do LED baseado no potenciômetro
  if (valorPot > limite) {
    digitalWrite(pinoLED, HIGH);
  } else {
    digitalWrite(pinoLED, LOW);
  }

  Serial.print("Valor do potenciômetro: ");
  Serial.println(valorPot);

  // Enviar dados do potenciômetro se conectado
  if (dispositivoConectado) {
    potCharacteristic->setValue(String(valorPot));
    potCharacteristic->notify();
  }

  delay(200);
}
