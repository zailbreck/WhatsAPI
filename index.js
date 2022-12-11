"use strict";
const {
    default: makeWASocket,
    DisconnectReason,
    makeInMemoryStore,
    useMultiFileAuthState, fetchLatestBaileysVersion,
} = require("@adiwajshing/baileys");

const pino = require('pino')
const MAIN_LOGGER = pino({timestamp: () => `,"time":"${new Date().toJSON()}"`})
const clogger = MAIN_LOGGER.child({ })
clogger.level = 'trace'

const useStore = !process.argv.includes("--no-store");

// Store WA Connection into Memory
const store = useStore ? makeInMemoryStore({
    logger: clogger
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
        logger: clogger,
        printQRInTerminal: true,
        auth: state,
        browser: ["ShelterID", "Chrome", "88.0.4324.182"],
        getMessage: async (key) => {
            return {
                conversation: "hello",
            };
        },
    })
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


    // Check if Got New Messages
    bot.on('messages.upsert', async res => {
        console.log("hay")
    });

    return shelterSock;
}

connectToWhatsApp().then(_ => {});

require('./handle')(shelterSock)