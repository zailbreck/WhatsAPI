const { simpleSendMessage } = require('../config')
module.exports = async (shelterSock, bot, msg, res, store) => {
    try{
        const { type, quotedMsg, mentioned, now, fromMe} = msg
        if(msg.isBaileys) return

        const chats = (type === 'conversation' && msg.message.conversation) ?
            msg.message.conversation : (type === 'imageMessage') && msg.message.imageMessage.caption ?
                msg.message.imageMessage.caption : (type === 'videoMessage') && msg.message.videoMessage.caption ?
                    msg.message.videoMessage.caption : (type === 'extendedTextMessage') && msg.message.extendedTextMessage.text ?
                        msg.message.extendedTextMessage.text : (type === 'buttonsResponseMessage') && quotedMsg.fromMe && msg.message.buttonsResponseMessage.selectedButtonId ?
                            msg.message.buttonsResponseMessage.selectedButtonId : (type === 'templateButtonReplyMessage') && quotedMsg.fromMe && msg.message.templateButtonReplyMessage.selectedId ?
                                msg.message.templateButtonReplyMessage.selectedId : (type === 'messageContextInfo') ?
                                    (msg.message.buttonsResponseMessage?.selectedButtonId || msg.message.listResponseMessage?.singleSelectReply.selectedRowId) : (type === 'listResponseMessage') && quotedMsg.fromMe && msg.message.listResponseMessage.singleSelectReply.selectedRowId ?
                                        msg.message.listResponseMessage.singleSelectReply.selectedRowId : ""
        const command = chats.toLowerCase().split(' ')[0] || ''
        const args = chats.split(' ')
        const content = JSON.stringify(msg.message)
        const from = msg.key.remoteJid
        const q = chats.slice(command.length + 1, chats.length)
        const pushname = msg.pushName
        const isGroup = msg.key.remoteJid.endsWith('@g.us')
        const groupMetadata = isGroup ? await shelterSock.groupMetadata(from) : ''
        const groupName = isGroup ? groupMetadata.subject : ''
        const groupId = isGroup ? groupMetadata.id : ''
        const groupMembers = isGroup ? groupMetadata.participants : ''
        // const groupAdmins = isGroup ? getGroupAdmins(groupMembers) : ''
        const isImage = (type === 'imageMessage')
        const isVideo = (type === 'videoMessage')
        const isSticker = (type === 'stickerMessage')
        const isQuotedMsg = (type === 'extendedTextMessage')
        const isQuotedImage = isQuotedMsg ? content.includes('imageMessage') : false
        const isQuotedAudio = isQuotedMsg ? content.includes('audioMessage') : false
        const isQuotedDocument = isQuotedMsg ? content.includes('documentMessage') : false
        const isQuotedVideo = isQuotedMsg ? content.includes('videoMessage') : false
        const isQuotedSticker = isQuotedMsg ? content.includes('stickerMessage') : false


        switch (command) {
            case ".hello":
                simpleSendMessage(shelterSock, from, "Hai")
                break
        }

    }catch(e){
        console.log(e);
    }
};