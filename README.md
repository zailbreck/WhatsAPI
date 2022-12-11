# Example Whatsapp API(Multi Device) with API and BOT handler
This repository is example from whatsapp-api from [adiwajshing/Baileys](https://github.com/adiwajshing/Baileys/tree/master)
This example get chat from restAPI (express) and publish message to spesific Number whatsapp

## Requirement
Nodejs v16 

## Installation
Install dependency first
```bash
npm install
```

Run app
```bash
npm start
```

## Usage
Qrcode will display in terminal after "npm start", in your whatsapp app on android/ios will set to sender.

## Send to number whatsapp to and the publish to mqtt 
Send message to your number whatsapp (whatsapp as sender and scan qrcode from terminal), topic will publish to broker ismaillowkey.my.id with topic **wa/receive**

## Send message from mqtt to spesific number whatsapp
Connet to broker ismaillowkey.my.id and publish with topic **wa/send** and with body (number must with country code like 62 or indonesia)
```
{
 "number" : "62xxxx",
 "message" :  "your message"
}
```

## Send message from mqtt to group whatsapp
Connet to broker ismaillowkey.my.id and publish with topic **wa/group/send** and with body (wa sender must join group)
```
{
 "name" : "your group name",
 "message" :  "your message"
}
```

## With pm2
[BUG] automatic restart app every 1 hour
```
pm2 start npm --name "whatsapi" -- start --cron-restart="0 * * * *"
```