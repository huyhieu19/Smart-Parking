#include <Arduino.h>
#include <Servo.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

const byte monUID[4] = {0x83, 0x53, 0xD5, 0xFD};
int IR1 = 3; // ENTRANCE SENSOR CONNECTED TO PIN 3 OF ARDUINO
int IR2 = 5; // ENTRANCE SENSOR CONNECTED TO PIN 5 OF ARDUINO

int flag1 = 0;
int flag2 = 0;
const int servoPin = 9; // Chân điều khiển động cơ servo kết nối với chân số 9 trên
// A4 (SDA)
// A5 (SCL)
LiquidCrystal_I2C lcd(0x27, 16, 2);
Servo myservo;
int haveCar = 0;

void displayMessage(int a)
{
  // Xóa nội dung trên màn hình LCD
  lcd.clear();

  // Kiểm tra giá trị của biến a và hiển thị thông báo tương ứng
  if (a == 1)
  {
    lcd.setCursor(0, 0);
    lcd.print("The hop le,");
    lcd.setCursor(0, 1);
    lcd.print("moi xe vao");
  }
  if (a == 11)
  {
    lcd.setCursor(0, 0);
    lcd.print("The, bien so hop");
    lcd.setCursor(0, 1);
    lcd.print("le, moi xe ra");
  }
  else if (a == 0)
  {
    lcd.setCursor(0, 0);
    lcd.print("The xe khong");
    lcd.setCursor(0, 1);
    lcd.print("hop le");
  }
  else if (a == 2)
  {
    lcd.setCursor(0, 0);
    lcd.print("Bien so khong");
    lcd.setCursor(0, 1);
    lcd.print("hop le");
  }
  else if (a == 3)
  {
    lcd.setCursor(0, 0);
    lcd.print("The het tien");
    lcd.setCursor(0, 1);
    lcd.print("Hay nap them");
  }
  else if (a == -1)
  {
    lcd.setCursor(0, 0);
    lcd.print("Vui long quet");
    lcd.setCursor(0, 1);
    lcd.print(" the");
  }
}

// 1 -> open; 2 close
void ControlBarie(int a)
{
  int pos = 0;
  if (a == 1)
  {
    for (pos = 0; pos < 95; pos += 1)
    {
      myservo.write(pos);
      delay(15);
    }
  }
  if (a == 0)
  {
    for (pos = 95; pos >= 1; pos -= 1)
    {
      myservo.write(pos);
      delay(15);
    }
  }
}

void setup()
{
  Serial.begin(9600);
  Serial.println("bat dau set up");
  SPI.begin();

  pinMode(servoPin, OUTPUT);
  myservo.attach(servoPin);
  myservo.write(0);

  lcd.init();
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);       // move cursor to   (0, 0)
  lcd.print("Smart Paking"); // print message at (0, 0)
  delay(5000);
  lcd.clear();

  pinMode(IR1, INPUT);
  pinMode(IR2, INPUT);

  Serial.println("ket thuc set up");
}

void loop()
{
  char data = Serial.read(); // Read the serial data and store it
  Serial.println("Nhan duoc: " + char(data));

  if (data == '1')
  {
    haveCar = 1;
    displayMessage(1);
    ControlBarie(1);
  }
  if (data == '5')
  {
    haveCar = 1;
    displayMessage(11);
    ControlBarie(1);
  }
  if (data == '0')
  {
    displayMessage(0);
    delay(5000);
    lcd.clear();
    displayMessage(-1);
  }
  if (data == '2')
  {
    displayMessage(2);
    delay(5000);
    lcd.clear();
    displayMessage(-1);
  }
  if (data == '3')
  {
    displayMessage(3);
    delay(5000);
    lcd.clear();
    displayMessage(-1);
  }

  delay(100);
  if (digitalRead(IR1) == LOW && flag1 == 0)
  {
    flag1 = 1;
  }
  if (digitalRead(IR2) == LOW && flag2 == 0)
  { // DETECTING OBSTACLE AT EXIT SENSOR
    flag2 = 1;
  }
  if (flag1 == 1 && flag2 == 1 && haveCar == 1)
  { // IF FLAG VALUE=1 GATE OPENS
    delay(1000);
    ControlBarie(0);
    flag1 = 0, flag2 = 0, haveCar = 0;
    delay(5000);
    lcd.clear();
    displayMessage(-1);
  }
}