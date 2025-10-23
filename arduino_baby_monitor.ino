// Sistema de Monitorização de Bebés - Arduino
// Sensores: Pressão (potenciômetro) e Som (simulado com segundo potenciômetro)

const int sensorPressaoPin = A0;  // Pino analógico do sensor de pressão (potenciômetro)
const int sensorSomPin = A1;      // Pino analógico do sensor de som (segundo potenciômetro)
const int pinoLED = 11;           // Pino digital do LED
const int pinoBuzzer = 9;         // Pino digital do buzzer para alertas

int valorPressao = 0;             // Valor lido do sensor de pressão
int valorSom = 0;                 // Valor lido do sensor de som
int limitePressao = 200;          // Limite para alerta de pressão
int limiteSom = 150;              // Limite para alerta de som

#include "SoftwareSerial.h"

// Criação da ligação Bluetooth
SoftwareSerial bluetooth(2, 3); // TX, RX

void setup() {
  pinMode(sensorPressaoPin, INPUT);
  pinMode(sensorSomPin, INPUT);
  pinMode(pinoLED, OUTPUT);
  pinMode(pinoBuzzer, OUTPUT);

  Serial.begin(9600);
  Serial.println(F("Sistema de Monitorização de Bebés iniciado..."));
  Serial.println(F("Sensores: Pressão (A0) e Som (A1)"));

  bluetooth.begin(9600);
  delay(1000);
  
  // Enviar dados iniciais
  enviarDadosBluetooth();
}

void loop() {
  // Lê os valores dos sensores
  valorPressao = analogRead(sensorPressaoPin);
  valorSom = analogRead(sensorSomPin);

  // Mostra no monitor série
  Serial.print("Pressão: ");
  Serial.print(valorPressao);
  Serial.print(" | Som: ");
  Serial.println(valorSom);

  // Enviar dados via Bluetooth a cada 2 segundos
  enviarDadosBluetooth();

  // Controlo do LED baseado na pressão
  if (valorPressao > limitePressao) {
    digitalWrite(pinoLED, HIGH);   // LED aceso - pressão alta
  } else {
    digitalWrite(pinoLED, LOW);    // LED apagado
  }

  // Alerta sonoro se som muito alto
  if (valorSom > limiteSom) {
    digitalWrite(pinoBuzzer, HIGH);
    delay(100);
    digitalWrite(pinoBuzzer, LOW);
  }

  delay(2000); // Pausa de 2 segundos entre leituras
}

void enviarDadosBluetooth() {
  // Formato: "PRESSÃO,SOM,TIMESTAMP"
  String dados = String(valorPressao) + "," + String(valorSom) + "," + String(millis());
  bluetooth.println(dados);
  Serial.println("Enviado via Bluetooth: " + dados);
}

