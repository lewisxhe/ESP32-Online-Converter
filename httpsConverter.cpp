#include <WiFi.h>
#include <WiFiClientSecure.h>

#define HTTPS_HOST "hostpro.onlineconverter.com"
#define HTTPS_PORT 443

WiFiClientSecure client;


const char *getstatus =
    "OPTIONS /file/send HTTP/1.1\r\n"
    "Host: www.onlineconverter.com\r\n"
    "Connection: keep-alive\r\n"
    "Origin: https://www.onlineconverter.com\r\n"
    "Access-Control-Request-Method: POST\r\n"
    "User-Agent: Mozilla/5.0 (Linux; Android 8.0.0; LG-US998) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.80 Mobile Safari/537.36\r\n"
    "Accept: */*\r\n"
    "Accept-Encoding: gzip, deflate, br\r\n"
    "Accept-Language: zh,zh-CN;q=0.9,en;q=0.8\r\n"
    "\r\n\r\n";

// 文件流  网络流
void online_converter(uint8_t *image, uint32_t size, uint32_t width, uint32_t height)
{
    size_t srcSize = size;
    size_t offset = 0;
    size_t ret = 0;
    uint32_t contentLen = 0;
    char status[64] = {0};

    // Serial.print(getstatus);

    if (!client.connect(HTTPS_HOST, HTTPS_PORT))
    {
        Serial.println("Connection failed");
        return;
    }

    Serial.println("----------------part 0 ----------------");
    client.print(getstatus);
    bzero(status, sizeof(status));
    client.readBytesUntil('\r', status, sizeof(status));

    Serial.print("Response: ");
    Serial.println(status);

    if (strncmp(status, "HTTP/1.1 200 OK", strlen("HTTP/1.1 200 OK")))
    {
        Serial.print("OPT Unexpected response: ");
        Serial.println(status);
        client.stop();
        return;
    }

    // clean buffer
    client.readString();

    String part2 = "------WebKitFormBoundary0iRfzTwnJS4466q8\r\n";
    part2 += "Content-Disposition: form-data; name=\"class\"\r\n";
    part2 += "\r\n";
    part2 += "image\r\n";
    part2 += "------WebKitFormBoundary0iRfzTwnJS4466q8\r\n";
    part2 += "Content-Disposition: form-data; name=\"from\"\r\n";
    part2 += "\r\n";
    part2 += "jpg\r\n";
    part2 += "------WebKitFormBoundary0iRfzTwnJS4466q8\r\n";
    part2 += "Content-Disposition: form-data; name=\"to\"\r\n";
    part2 += "\r\n";
    part2 += "bmp\r\n";
    part2 += "------WebKitFormBoundary0iRfzTwnJS4466q8\r\n";
    part2 += "Content-Disposition: form-data; name=\"source\"\r\n";
    part2 += "\r\n";
    part2 += "file\r\n";
    part2 += "------WebKitFormBoundary0iRfzTwnJS4466q8\r\n";
    part2 += "Content-Disposition: form-data; name=\"file\"; filename=\"IMG.jpg\"\r\n";
    part2 += "Content-Type: image/jpeg\r\n";
    part2 += "\r\n";

    String part3 = "------WebKitFormBoundary0iRfzTwnJS4466q8\r\n";
    part3 += "Content-Disposition: form-data; name=\"resize-1\"\r\n";
    part3 += "\r\n";
    part3 += "200\r\n";
    part3 += "------WebKitFormBoundary0iRfzTwnJS4466q8\r\n";
    part3 += "Content-Disposition: form-data; name=\"resize-2\"\r\n";
    part3 += "\r\n";
    part3 += "200\r\n";
    part3 += "------WebKitFormBoundary0iRfzTwnJS4466q8--\r\n";
    part3 += "\r\n";

    contentLen = part2.length() + part3.length() + size;
    Serial.print("ContentLenght: ");
    Serial.println(contentLen);

    String part1 = "POST /file/send HTTP/1.1\r\n";
    part1 += "Host: www.onlineconverter.com\r\n";
    part1 += "Connection: keep-alive\r\n";
    part1 += "Content-Length: " + String(contentLen) + "\r\n";
    part1 += "Origin: https://www.onlineconverter.com\r\n";
    part1 += "User-Agent: Mozilla/5.0 (Linux; Android 8.0.0; LG-US998) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.80 Mobile Safari/537.36\r\n";
    part1 += "Content-Type: multipart/form-data; boundary=----WebKitFormBoundary0iRfzTwnJS4466q8\r\n";
    part1 += "Accept: */*\r\n";
    part1 += "Referer: https://www.onlineconverter.com/jpg-to-bmp\r\n";
    part1 += "Accept-Encoding: gzip, deflate, br\r\n";
    part1 += "Accept-Language: zh,zh-CN;q=0.9,en;q=0.8\r\n";
    part1 += "\r\n\r\n";

    client.print(part1);
    client.print(part2);

    //图片内容
    while (1)
    {
        ret = client.write(image + offset, size);
        offset += ret;
        size -= ret;
        if (srcSize == offset)
        {
            break;
        }
    }

    client.print(part3);

    // Serial.print(part1);
    // Serial.print(part2);
    // Serial.print(part3);

    Serial.println("Response ---");
    //处理返回链接,下载地址
    Serial.println("----------------part 1 ----------------");

    // Serial.println(client.readString());

    bzero(status, sizeof(status));
    client.readBytesUntil('\r', status, sizeof(status));
    if (strncmp(status, "HTTP/1.1 200 OK", strlen("HTTP/1.1 200 OK")))
    {
        Serial.print("Unexpected response: ");
        Serial.println(status);
        client.stop();
        return;
    }
    Serial.println("---------------- -END -----------------");

    if (!client.find("\r\n\r\n"))
    {
        Serial.println("Invalid response");
        client.stop();
        return;
    }
    part2 = client.readString();
    //TODO: 判断是否busy
    //.....

    part2 = part2.substring(part2.indexOf("https:"));
    part2 = part2.substring(0, part2.indexOf("\r\n"));

    // int i = part2.indexOf("/",String("https://").length());
    int i = part2.lastIndexOf("/");
    part2 = part2.substring(i);
    Serial.println("Src Path:" + part2);

    Serial.println("---------------- -END -----------------");

    Serial.println("----------------part 2 ----------------");
    //Get Request
    part1 = "GET /file" + part2 + "/download HTTP/1.1\r\n";
    part1 += "Host: www.onlineconverter.com\r\n";
    part1 += "Connection: keep-alive\r\n";
    part1 += "Upgrade-Insecure-Requests: 1\r\n";
    part1 += "User-Agent: Mozilla/5.0 (Linux; Android 8.0.0; LG-US998) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.80 Mobile Safari/537.36\r\n";
    part1 += "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8\r\n";
    part1 += "Referer: https://www.onlineconverter.com/convert" + part2 + "\r\n";
    part1 += "Accept-Encoding: gzip, deflate, br\r\n";
    part1 += "Accept-Language: zh,zh-CN;q=0.9,en;q=0.8\r\n";
    part1 += "\r\n\r\n";

    client.print(part1);

    delay(2000);

    Serial.println("Send request : ");
    Serial.println(part1);
    Serial.println("---------------- -END -----------------");

    Serial.println("Response ----");
    // 等待下载文件
    Serial.println("----------------part 3 ----------------");

    Serial.println(client.readString());
    return;

    bzero(status, sizeof(status));
    client.readBytesUntil('\r', status, sizeof(status));

    Serial.println(status);

    if (strncmp(status, "HTTP/1.1 200 OK", strlen("HTTP/1.1 200 OK")))
    {
        Serial.print("Unexpected response: ");
        Serial.println(status);
        client.stop();
        return;
    }

    String response = "";
    int start, end, r, rbytes;

    rbytes = client.find("\r\n\r\n");
    if (!rbytes)
    {
        Serial.println("Invalid response");
        client.stop();
        return;
    }
    Serial.printf("rBytes : %d\n", rbytes);

    uint8_t *buf = new uint8_t[rbytes];
    if (!buf)
    {
        Serial.println("malloc fail");
        client.stop();
        return;
    }

    r = client.read(buf, rbytes);
    if (r != rbytes)
    {
        Serial.printf("read bytes fail : %d\n", r);
    }

    Serial.printf("%s\n", buf);

    client.stop();
    delete[] buf;
}
