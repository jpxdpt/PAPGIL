#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include <DHT.h>

#define buttonPin 33     // Botão no IO33 (sentado: 1, não sentado: 0)
#define pinoLED 13       // LED no pino 13
#define DHTPIN 4
#define DHTTYPE DHT11
const int PINO_SENSOR = 32;           // Sensor de som no IO32 (ADC1_CH4)
const int SOUND_THRESHOLD = 2000;     // Limite de som para considerar "a chorar"

DHT dht(DHTPIN, DHTTYPE);

// UUIDs do serviço e características
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define BUTTON_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define TEMPERATURE_CHAR_UUID "d0ffee01-1234-5678-9abc-def012345678"
#define HUMIDITY_CHAR_UUID "e0ffee01-1234-5678-9abc-def012345678"
#define SOUND_SENSOR_CHAR_UUID "f0ffee01-1234-5678-9abc-def012345678"
#define SOUND_STATUS_CHAR_UUID "f0ffee02-1234-5678-9abc-def012345678"
#define NOTIFICATION_CHAR_UUID "c0ffee01-1234-5678-9abc-def012345678"

BLECharacteristic *buttonCharacteristic;
BLECharacteristic *tempCharacteristic;
BLECharacteristic *humidityCharacteristic;
BLECharacteristic *soundCharacteristic;
BLECharacteristic *soundStatusCharacteristic;
BLECharacteristic *notificationCharacteristic;

bool dispositivoConectado = false;
int valorBotao = 0;     // estado do botão
int valorSom = 0;       // valor analógico do som
bool aChorar = false;   // estado derivado do som
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

      String notificationStr = value;

      if (notificationStr.indexOf("\"type\":\"alert\"") >= 0) {
        Serial.println("🚨 ALERTA CRÍTICO recebido!");
        for (int i = 0; i < 10; i++) {
          digitalWrite(pinoLED, HIGH);
          delay(100);
          digitalWrite(pinoLED, LOW);
          delay(100);
        }
      } else if (notificationStr.indexOf("\"type\":\"warning\"") >= 0) {
        Serial.println("⚠️ ALERTA recebido!");
        for (int i = 0; i < 3; i++) {
          digitalWrite(pinoLED, HIGH);
          delay(200);
          digitalWrite(pinoLED, LOW);
          delay(200);
        }
      } else if (notificationStr.indexOf("\"type\":\"success\"") >= 0) {
        Serial.println("✅ SUCESSO recebido!");
        for (int i = 0; i < 2; i++) {
          digitalWrite(pinoLED, HIGH);
          delay(300);
          digitalWrite(pinoLED, LOW);
          delay(300);
        }
      } else if (notificationStr.indexOf("\"type\":\"info\"") >= 0) {
        Serial.println("📢 INFORMAÇÃO recebida!");
        digitalWrite(pinoLED, HIGH);
        delay(500);
        digitalWrite(pinoLED, LOW);
      }
    }
  }
};

void setup() {
  Serial.begin(115200);

  // Botão e LED
  pinMode(buttonPin, INPUT);
  pinMode(pinoLED, OUTPUT);

  // Sensor de som
  pinMode(PINO_SENSOR, INPUT);

  // DHT11
  dht.begin();

  // BLE
  BLEDevice::init("ESP32_BLE_Botao_Som_LED");
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Botão (substitui o potenciômetro)
  buttonCharacteristic = pService->createCharacteristic(
    BUTTON_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  buttonCharacteristic->addDescriptor(new BLE2902());

  // Temperatura
  tempCharacteristic = pService->createCharacteristic(
    TEMPERATURE_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  tempCharacteristic->addDescriptor(new BLE2902());

  // Humidade
  humidityCharacteristic = pService->createCharacteristic(
    HUMIDITY_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  humidityCharacteristic->addDescriptor(new BLE2902());

  // Valor bruto do sensor de som
  soundCharacteristic = pService->createCharacteristic(
    SOUND_SENSOR_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  soundCharacteristic->addDescriptor(new BLE2902());

  // Estado derivado do som (a chorar / calmo)
  soundStatusCharacteristic = pService->createCharacteristic(
    SOUND_STATUS_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  soundStatusCharacteristic->addDescriptor(new BLE2902());

  // Notificação
  notificationCharacteristic = pService->createCharacteristic(
    NOTIFICATION_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  notificationCharacteristic->setCallbacks(new NotificationCallbacks());

  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  BLEDevice::startAdvertising();

  Serial.println("BLE ativo: Botão(33) + Som(32) + DHT11(4). Aguardando conexão...");
}

void loop() {
  // Botão
  valorBotao = digitalRead(buttonPin);
  Serial.print("Botão: ");
  Serial.print(valorBotao);

  if (valorBotao == 1 && aChorar) {
    digitalWrite(pinoLED, HIGH);
  } else {
    digitalWrite(pinoLED, LOW);
  }

  // Sensor de som no IO32 (ADC1_CH4)
  valorSom = analogRead(PINO_SENSOR);
  aChorar = valorSom >= SOUND_THRESHOLD;
  Serial.print(" | Som(32): ");
  Serial.print(valorSom);
  Serial.print(" | Chorar: ");
  Serial.print(aChorar ? "SIM" : "não");

  // DHT11
  temperatura = dht.readTemperature();
  humidade = dht.readHumidity();

  if (isnan(temperatura) || isnan(humidade)) {
    Serial.println(" | Erro DHT11!");
    temperatura = 0;
    humidade = 0;
  } else {
    Serial.print(" | Temp: ");
    Serial.print(temperatura);
    Serial.print("°C | Hum: ");
    Serial.print(humidade);
    Serial.println("%");
  }

  // Enviar dados se conectado
  if (dispositivoConectado) {
    buttonCharacteristic->setValue(String(valorBotao));
    buttonCharacteristic->notify();

    soundCharacteristic->setValue(String(valorSom));
    soundCharacteristic->notify();

    soundStatusCharacteristic->setValue(aChorar ? "1" : "0");
    soundStatusCharacteristic->notify();

    tempCharacteristic->setValue(String(temperatura));
    tempCharacteristic->notify();

    humidityCharacteristic->setValue(String(humidade));
    humidityCharacteristic->notify();
  }

  delay(2000);
}

