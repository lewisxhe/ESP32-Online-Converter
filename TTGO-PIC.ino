
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include "httpsConverter.h"

#include <SPIFFS.h>
#include <FS.h>
#define FILESYSTEM SPIFFS

const char *ssid = "xinyuan";      // Put your SSID here
const char *password = "12345678"; // Put your PASSWORD here

String str = "HTTP/1.1 200 OK\r\nServer: WebServer\r\n"
             "Date: Tue, 20 Nov 2018 11:05:27 GMT\r\n"
             "Content-Type: application/octet-stream\r\n"
             "Content-Length: 29738\r\n"
             "Connection: keep-alive\r\n"
             "pragma: public\r\n"
             "expires: -1\r\n"
             "cache-control: public, must-revalidate, post-check=0, pre-check=0\r\n"
             "content-transfer-encoding: binary\r\n"
             "content-description: file transfer\r\n"
             "content-disposition: attachment; filename=\"TIM.bmp\"\r\n"
             "Access-Control-Allow-Origin: https://www.onlineconverter.com\r\n"
             "Vary: Origin\r\n"
             "Content-Security-Policy: default-src 'none';\r\n"
             "X-Frame-Options: allow-from https://www.onlineconverter.com/\r\n"
             "X-XSS-Protection: 1; mode=block\r\n";

void setup()
{
    Serial.begin(115200);

    // String part2 = "https://www.onlineconverter.com/convert/1006d2d318de0cacf322902dfa0f9ce2ee";
    // int i = part2.lastIndexOf("/");
    // part2 = part2.substring(i);
    // Serial.println(part2);
    // return;


    // String str1 = "2c\r\n"
    //               "https://www.onlineconverter.com/convert/busy\r\n"
    //               "0\r\n";

    // int start = str1.indexOf("https:");

    // str1 = str1.substring(start);
    // str1 =  str1.substring(0,str1.indexOf("\r\n"));
    // Serial.println("----------path--------");
    // Serial.println(str1);
    // return;



    // int start = str.indexOf("Content-Length:");

    // str = str.substring(start);

    // Serial.println(str);

    // start = str.indexOf(" ");
    // int end = str.indexOf("\r\n");

    // Serial.println(start);
    // Serial.println(end);

    // Serial.println(str.substring(0, end));
    // Serial.println("----------------\r\n");
    // Serial.println(str.substring(start, end).toInt());

    // String part2 = "https://www.onlineconverter.com/convert/10c6bebea623fb860389dfadddeca2ebea";

    // Serial.println(part2.substring(part2.lastIndexOf("/")));

    // int i = part2.indexOf("/", String("https://").length());

    // part2 = part2.substring(i);

    // Serial.println(part2);

    // return;

    if (!FILESYSTEM.begin())
    {
        Serial.println("FILESYSTEM is not database");
        Serial.println("Please use Arduino ESP32 Sketch data Upload files");
        while (1)
        {
            delay(1000);
        }
    }

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(F("."));
    }
    Serial.println(F("WiFi connected"));
    Serial.println("");
    Serial.println(WiFi.localIP());

    File file = FILESYSTEM.open("/TIM.jpg");
    if (!file)
    {
        Serial.println("Open Fial -->");
        return;
    }
    Serial.print("filesize: ");
    Serial.println(file.size());

    uint8_t *p = (uint8_t *)malloc(file.size());
    if (!p)
    {
        Serial.println("malloc fail");
        return;
    }

    size_t size = file.read(p, file.size());

    if (size != file.size())
    {
        Serial.println("Read fail");
        return;
    }

    file.close();

    online_converter(p, size, 100, 100);

    free(p);
}

void loop()
{
    delay(30000);
}