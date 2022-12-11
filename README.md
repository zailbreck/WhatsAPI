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

## Send message to spesific number whatsapp
```
http://localhost:port/sendMessage?chatID={regionCode}{phoneNumber}&message={message}
```
Example
```
http://localhost:port/sendMessage?chatID=621234567890&message=Hello World
```

## Send message to group whatsapp (Coming Soon)
```
http://localhost:port/sendMessageGroup?groupID={regionCode}{phoneNumber}&message={message}
```
Example
```
http://localhost:port/sendMessageGroup?groupID=621234567890&message=Hello World
```

## With pm2
[BUG] automatic restart app every 1 hour
```
pm2 start npm --name "whatsapi" -- start --cron-restart="0 * * * *"
```