"use strict";
const {
    default: makeWASocket,
    DisconnectReason,
    makeInMemoryStore,
    useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, PHONENUMBER_MCC,
} = require("@whiskeysockets/baileys");
const { autoMod, serialize, botLogger, botLoggerChild } = require('./config')
const fs = require('fs')
const parsePhoneNumber = require('libphonenumber-js')
const readline = require('readline');
// Force Logger Level
botLogger().level = 'trace'

// Cache biar cepet
const NodeCache = require('node-cache')
const e = require("express");
const {createInterface} = require("readline");
const msgRetryCounterCache = new NodeCache();

// Extra Parameter (Untuk Handle jika ada)
const useStore = !process.argv.includes('--no-store')
const doReplies = !process.argv.includes('--no-reply')
const useMobile = process.argv.includes('--register')


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
    // console.clear()
    console.log('Checking Session ...')
}

let shelterSock;
let bot;
const connectToWhatsApp = async () => {
    console.clear()
    // Load and Save Session Login
    const { state, saveCreds } = await useMultiFileAuthState("baileys_auth_info")
    // Fetch Latest version WA Web
    const { version, isLatest} = await fetchLatestBaileysVersion()
    console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

    shelterSock = makeWASocket({
        version,
        logger: botLogger(),
        printQRInTerminal: true,
        // auth: state,
        mobile: useMobile,
        auth: {
          creds: state.creds,
            /** caching makes the store faster to send/recv messages */
          keys: makeCacheableSignalKeyStore(state.keys, botLogger()),
        },
        msgRetryCounterCache,
        generateHighQualityLinkPreview: true,
        // Change User Agent Here
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


    // New Login Update via Mobile Number
    if(useMobile && !shelterSock.authState.creds.registered) {
        // const question = (text) => new Promise<string>((resolve) => rl.question(text, resolve))
        var question = function(text) {
            return new Promise(function(resolve) {
                rl.question(text, resolve);
            });
        };
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
        const { registration } = shelterSock.authState.creds || { registration: {} }

        if(!registration.phoneNumber) {
            registration.phoneNumber = await question('Please enter your mobile phone number:  ')
        }

        const phoneNumber = parsePhoneNumber(registration?.phoneNumber)
        if(!phoneNumber?.isValid()) {
            console.log('Invalid phone number: ' + registration?.phoneNumber)
            process.exit(1)
        }

        registration.phoneNumber = phoneNumber.format('E.164')
        registration.phoneNumberCountryCode = phoneNumber.countryCallingCode
        registration.phoneNumberNationalNumber = phoneNumber.nationalNumber
        const mcc = PHONENUMBER_MCC[phoneNumber.countryCallingCode]
        if(!mcc) {
            throw new Error('Could not find MCC for phone number: ' + registration?.phoneNumber + '\nPlease specify the MCC manually.')
        }

        registration.phoneNumberMobileCountryCode = mcc

        async function enterCode() {
            try {
                const code = await question('Please enter the one time code: ')
                const response = await shelterSock.register(code.replace(/["']/g, '').trim().toLowerCase())
                console.log('Successfully registered your phone number.')
                console.log(response)
                rl.close()
            } catch(error) {
                console.error('Failed to register your phone number. Please try again.\n', error)
                await askForOTP()
            }
        }

        async function askForOTP() {
            let code = await question('How would you like to receive the one time code for registration? "sms" or "voice" ')
            code = code.replace(/["']/g, '').trim().toLowerCase()

            if(code !== 'sms' && code !== 'voice') {
                return await askForOTP()
            }

            registration.method = code

            try {
                await shelterSock.requestRegistrationCode(registration)
                await enterCode()
            } catch(error) {
                console.error('Failed to request registration code. Please try again.\n', error)
                await askForOTP()
            }
        }

        askForOTP()
    }

    // Check Current Sessions
    bot.on('connection.update', (update) => {

        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            console.log('Connection Close')
            // Reconnect jika di kick
            if (lastDisconnect?.error.output?.statusCode !== DisconnectReason.loggedOut) {
                connectToWhatsApp()
            }else {
                console.log("Connection closed. You are logged out.");
                // Force Delete Session and Intterup
                console.log("Clean Expired Session!")
                fs.rmSync("baileys_auth_info", { recursive: true, force: true });
                fs.unlink("./multi_session.json", (err) => { console.log("Error") });
                process.exit(1);
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

