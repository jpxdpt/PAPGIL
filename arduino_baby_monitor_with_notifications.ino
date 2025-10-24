#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include <DHT.h>
#include <ArduinoJson.h>

#define potenciometroPin 34
#define pinoLED 2
#define DHTPIN 4
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

// UUIDs do serviço e características
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define POTENTIOMETER_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define TEMPERATURE_CHAR_UUID "d0ffee01-1234-5678-9abc-def012345678"
#define HUMIDITY_CHAR_UUID "e0ffee01-1234-5678-9abc-def012345678"
#define NOTIFICATION_CHAR_UUID "c0ffee01-1234-5678-9abc-def012345678"

BLECharacteristic *potCharacteristic;
BLECharacteristic *tempCharacteristic;
BLECharacteristic *humidityCharacteristic;
BLECharacteristic *notificationCharacteristic;
bool dispositivoConectado = false;
int valorPot = 0;
const int limite = 2000;
float temperatura = 0;
float humidade = 0;

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
  
  // Inicializar sensor DHT11
  dht.begin();

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

  // Característica de temperatura (READ + NOTIFY)
  tempCharacteristic = pService->createCharacteristic(
    TEMPERATURE_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  tempCharacteristic->addDescriptor(new BLE2902());

  // Característica de humidade (READ + NOTIFY)
  humidityCharacteristic = pService->createCharacteristic(
    HUMIDITY_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  humidityCharacteristic->addDescriptor(new BLE2902());

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

  // Ler temperatura e humidade do DHT11
  temperatura = dht.readTemperature();
  humidade = dht.readHumidity();

  // Verificar se a leitura é válida
  if (isnan(temperatura) || isnan(humidade)) {
    Serial.println("Erro ao ler DHT11!");
    temperatura = 0;
    humidade = 0;
  }

  // Controlo automático do LED baseado no potenciômetro
  if (valorPot > limite) {
    digitalWrite(pinoLED, HIGH);
  } else {
    digitalWrite(pinoLED, LOW);
  }

  Serial.print("Potenciômetro: ");
  Serial.print(valorPot);
  Serial.print(" | Temperatura: ");
  Serial.print(temperatura);
  Serial.print("°C | Humidade: ");
  Serial.print(humidade);
  Serial.println("%");

  // Enviar dados se conectado
  if (dispositivoConectado) {
    // Enviar potenciômetro
    potCharacteristic->setValue(String(valorPot));
    potCharacteristic->notify();
    
    // Enviar temperatura
    tempCharacteristic->setValue(String(temperatura));
    tempCharacteristic->notify();
    
    // Enviar humidade
    humidityCharacteristic->setValue(String(humidade));
    humidityCharacteristic->notify();
  }

  delay(2000); // DHT11 precisa de pelo menos 2 segundos entre leituras
}
