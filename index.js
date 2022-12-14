"use strict";
const {
    default: makeWASocket,
    DisconnectReason,
    makeInMemoryStore,
    useMultiFileAuthState, fetchLatestBaileysVersion,
} = require("@adiwajshing/baileys");
const pino = require('pino')
const { autoMod, serialize, botLogger, botLoggerChild } = require('./config')



const useStore = !process.argv.includes("--no-store");
const logg = require('pino')
// Store WA Connection into Memory
const store = useStore ? makeInMemoryStore({
    logger: botLogger()
}) : undefined
store?.readFromFile("./multi_session.json")
// Save Every 10s
setInterval(() => {
    store?.writeToFile("./multi_session.json")
}, 10_000)

function landingPage(){
    console.clear()
    console.log('Checking Session ...')
}

let shelterSock;
let bot;
const connectToWhatsApp = async () => {
    // Load and Save Session Login
    const { state, saveCreds } = await useMultiFileAuthState("baileys_auth_info")
    // Fetch Latest version WA Web
    const { version, isLatest} = await fetchLatestBaileysVersion()
    console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

    shelterSock = makeWASocket({
        version,
        logger: botLogger(),
        printQRInTerminal: true,
        auth: state,
        browser: ["ShelterID", "Chrome", "88.0.4324.182"],
        getMessage: async (key) => {
            return {
                conversation: "hello",
            };
        },
    })

    // AutoLoad Handle When Modified
    autoMod('./Handle/API', _ => console.log("API has been Updated"))
    autoMod('./Handle/BOT', _ => console.log("BOT has been Updated"))

    landingPage()
    store?.bind(shelterSock.ev)
    bot = shelterSock.ev

    // Check Current Sessions
    bot.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            console.log('Connection Close')
            if (lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut) {
                connectToWhatsApp()
            }else {
                console.log("Connection closed. You are logged out.");
            }
        }else if (connection === 'open'){
            console.log("Connection Open")
        }
    })

    // Handle Some Requests
    bot.on("call", async () => {})
    bot.on("chats.set", async () => {})
    bot.on("messages.set", async () => {})
    bot.on("contacts.set", async () => {})
    bot.on("messages.update", async () => {});
    bot.on("message-receipt.update", async () => {});
    bot.on("presence.update", async () => {});
    bot.on("chats.update", async () => {});
    bot.on("chats.delete", async () => {});
    bot.on("contacts.upsert", async () => {});
    bot.on("creds.update", saveCreds);
    bot.on('groups.update', async () => {});
    bot.on('message-receipt.update', async () => {});
    bot.on('group-participants.update', async () => {});

    // Custom Handle
    // Handle Request from API
    await require('./Handle/API')(shelterSock, bot)

    // Check if Got New Messages
    bot.on('messages.upsert', async res => {
        if (!res.messages) return
        let msg = res.messages[0];
        msg = serialize(shelterSock, msg)
        msg.isBaileys = msg.key.id.startsWith('BAE5') || msg.key.id.startsWith('3EB0')
        // const from = msg.key.remoteJid

        // Call Message Handler & Passing Data
        await require('./Handle/BOT')(shelterSock, bot, msg, res, store)
    });

    return shelterSock;
}

connectToWhatsApp().then(_ => console.log("WhatsAPI is Running ..."));

