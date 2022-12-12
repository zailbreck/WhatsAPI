const fs = require('fs')
const pino = require('pino')

exports.botLogger = () => {
    return pino({
            level: "silent",
            stream: 'ShelterStream',
            timestamp: () => `,"time":"${new Date().toJSON()}"`
        },
        pino.destination('./Shelter-log.log')
    )
}
exports.serialize = (conn, msg) => {
    msg.isGroup = msg.key.remoteJid.endsWith('@g.us')
    try{
        msg.type = Object.keys(msg.message)[0]
    } catch {
        msg.type = null
    }
    try{
        const context = msg.message[msg.type].contextInfo.quotedMessage
        if(context["ephemeralMessage"]){
            msg.quotedMsg = context.ephemeralMessage.message
        }else{
            msg.quotedMsg = context
        }
        msg.isQuotedMsg = true
        msg.quotedMsg.sender = msg.message[msg.type].contextInfo.participant
        msg.quotedMsg.fromMe = msg.quotedMsg.sender === conn.user.id.split(':')[0] + '@s.whatsapp.net'
        msg.quotedMsg.type = Object.keys(msg.quotedMsg)[0]
        let qtd = msg.quotedMsg
        msg.quotedMsg.chats = (qtd.type === 'conversation' && qtd.conversation) ? qtd.conversation : (qtd.type === 'imageMessage') && qtd.imageMessage.caption ? qtd.imageMessage.caption : (qtd.type === 'documentMessage') && qtd.documentMessage.caption ? qtd.documentMessage.caption : (qtd.type == 'videoMessage') && qtd.videoMessage.caption ? qtd.videoMessage.caption : (qtd.type === 'extendedTextMessage') && qtd.extendedTextMessage.text ? qtd.extendedTextMessage.text : (qtd.type === 'buttonsMessage') && qtd.buttonsMessage.contentText ? qtd.buttonsMessage.contentText : ""
        msg.quotedMsg.id = msg.message[msg.type].contextInfo.stanzaId
    }catch{
        msg.quotedMsg = null
        msg.isQuotedMsg = false
    }

    try{
        msg.mentioned = msg.message[msg.type].contextInfo.mentionedJid
    }catch{
        msg.mentioned = []
    }

    if (msg.isGroup){
        msg.sender = msg.participant
    }else{
        msg.sender = msg.key.remoteJid
    }
    if (msg.key.fromMe){
        msg.sender = conn.user.id.split(':')[0]+'@s.whatsapp.net'
    }

    msg.from = msg.key.remoteJid
    msg.now = msg.messageTimestamp
    msg.fromMe = msg.key.fromMe

    return msg
}
exports.autoMod = (module, callback) => {
    fs.watchFile(require.resolve(module), async () => {
        await clearCache(require.resolve(module))
        callback(module)
    })
}


function clearCache(module = '.') {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(module)]
            resolve()
        } catch (e) {
            reject(e)
        }
    })
}