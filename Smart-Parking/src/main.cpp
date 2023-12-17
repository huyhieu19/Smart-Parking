#include <SPI.h>
#include <MFRC522.h>
#include <ESP8266WiFi.h>
#include <Wire.h>
#include <Hash.h>
#include <SoftwareSerial.h>
#include <ESP8266WiFi.h>
#include <string>
#include <PubSubClient.h>
#include <Servo.h>
#include <IRremoteESP8266.h>
#include <IRrecv.h>
#include <IRutils.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define SS_PIN D3  // D2 on NodeMCU, SDA on Wemos D1 Mini
#define RST_PIN D4 // D1 on NodeMCU, SCL on Wemos D1 Mini

// Wi-Fi information
const char *ssid = "...";
const char *password = "1905200106102002";
// const char *ssid = "FPT Telecom.2.4G";
// const char *password = "22121999";
// Started SoftwareSerial at RX and TX pin of ESP8266/NodeMCU
SoftwareSerial s(3, 1);

const char *mqttServer = "broker.emqx.io";
const int mqttPort = 1883;
const char *mqttUser = "your_MQTT_username";
const char *mqttPassword = "your_MQTT_password";
// const int servoPin = D8; // Chân D1 được sử dụng để kết nối với servo
// const int irReceiverPin = D1;

// LiquidCrystal_I2C lcd(0x27, 16, 2);

MFRC522 mfrc522(SS_PIN, RST_PIN); // Create MFRC522 instance
// Initialize client and wifi
WiFiClient espClient;
PubSubClient client(espClient);

// // SoftwareSerial esp8266Serial(RX_PIN, TX_PIN); // RX, TX
// Servo myServo; // Khai báo một đối tượng servo
// IRrecv irReceiver(irReceiverPin);
// decode_results results;

void splitTopic(String topic, String *topicArray, int arraySize)
{
    uint lastIndex = 0;
    int index = topic.indexOf('/');
    int i = 0;

    while (index != -1 && i < arraySize)
    {
        topicArray[i] = topic.substring(lastIndex, index);
        lastIndex = index + 1;
        index = topic.indexOf('/', lastIndex);
        i++;
    }

    if (lastIndex < topic.length() && i < arraySize)
    {
        topicArray[i] = topic.substring(lastIndex);
    }
}

void PublishUID(String uid)
{
    std::string topic = "Hust/htn/test/esp";
    client.publish(topic.c_str(), uid.c_str());
    Serial.println("Da publis uid");
}

// Callback method
void callback(char *topic, byte *payload, unsigned int length)
{
    String topicString = String(topic);
    String payloadString = "";
    for (uint i = 0; i < length; i++)
    {
        payloadString += (char)payload[i];
    }

    Serial.print("Received message from topic: ");
    Serial.println(topicString);
    Serial.print("Payload: ");
    Serial.println(payloadString);

    if (payloadString == "0")
    {
        s.write("0");
    }
    else if (payloadString == "1")
    {
        s.write("1");
    }
    else if (payloadString == "5")
    {
        s.write("5");
    }
    else if (payloadString == "2")
    {
        s.write("2");
    }
    else if (payloadString == "3")
    {
        s.write("3");
    }
}
// The function tries to reconnect MQTT when the connection is lost
void reconnect()
{
    while (!client.connected())
    {
        Serial.println("Attempting MQTT connection...");

        if (client.connect("ESP8266Client", mqttUser, mqttPassword))
        {
            // Đăng ký theo dõi các topic
            std::string topic = "Hust/htn/test";
            client.subscribe(topic.c_str());
        }
        else
        {
            Serial.print("Failed, rc=");
            Serial.print(client.state());
            Serial.println(" Retrying in 5 seconds...");
            delay(1000);
        }
    }
}

void setup()
{
    Serial.begin(9600);
    s.begin(9600);
    // myServo.attach(servoPin); // Kết nối chân servo với chân D1
    SPI.begin();
    // mfrc522.PCD_Init();
    //  Thiết lập kết nối Wi-Fi
    WiFi.begin(ssid, password);
    // Khởi tạo giao tiếp I2C
    Wire.begin();

    // Thiết lập kết nối MQTT
    client.setServer(mqttServer, mqttPort);
    client.setCallback(callback);
    while (!client.connected())
    {
        Serial.println("Connecting to MQTT broker...");

        if (client.connect("ESP8266Clien123232gfhds"))
        {
            Serial.println("Connected to MQTT broker");

            // Đăng ký theo dõi các topic
            std::string topic = "Hust/htn/test";
            client.subscribe(topic.c_str());
        }
        else
        {
            Serial.print("Failed, rc=");
            Serial.print(client.state());
            Serial.println("Retrying in 5 seconds...");
            delay(1000);
        }
    }
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(1000);
        Serial.println("Connecting to WiFi...");
    }
    Serial.println("Connected to WiFi");

    Serial.println("RFID Reader Initialized");
}

void loop()
{

    static unsigned long lastLoop1Time = 0;   // Lưu thời điểm thực hiện vòng lặp 1
    static unsigned long lastLoop2Time = 0;   // Lưu thời điểm thực hiện vòng lặp 2
    const unsigned long loop1Interval = 5000; // Thời gian giữa các lần chạy vòng lặp 1 (5s)
    const unsigned long loop2Interval = 100;  // Thời gian giữa các lần chạy vòng lặp 2 (0.1s)

    // Your ESP8266 code here

    // Vòng lặp 1 (chạy mỗi 5 giây)
    if (millis() - lastLoop1Time >= loop1Interval)
    {
        // Thực hiện các hành động của vòng lặp 1
        // ...
        // kết nối broker
        if (!client.connected())
        {
            reconnect();
        }

        // delay(1000); // Chờ 1 giây
        // s.write("1");
        // delay(7000);
        //  Cập nhật thời điểm thực hiện vòng lặp 1
        lastLoop1Time = millis();
    }
    // Vòng lặp 2 (chạy mỗi 1 giây)
    if (millis() - lastLoop2Time >= loop2Interval)
    {
        if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial())
        {
            Serial.println("Card detected!");

            // Print UID
            String uidString = ""; // Khởi tạo chuỗi để lưu trữ UID

            for (byte i = 0; i < mfrc522.uid.size; ++i)
            {
                uidString += (mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ") + String(mfrc522.uid.uidByte[i], HEX);
            }

            Serial.println("UID: " + uidString);
            PublishUID(uidString);

            Serial.println();

            // Read card data
            Serial.print("Card Data: ");
            String cardData = "";
            for (byte i = 0; i < mfrc522.uid.size; ++i)
            {
                cardData += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
                cardData += String(mfrc522.uid.uidByte[i], HEX);
            }
            Serial.println(cardData);

            delay(1000); // Delay to avoid continuous reading
        }
        client.loop();

        // Cập nhật thời điểm thực hiện vòng lặp 2
        lastLoop2Time = millis();
    }
}