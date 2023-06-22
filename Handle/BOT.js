const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { simpleSendMessage } = require('../config')
const fs = require('fs')
const XLSX = require('xlsx');
module.exports = async (shelterSock, bot, msg, res, store) => {
    try{
        let stream = undefined
        let buffer = Buffer.from([])
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
            
            case (".bc" || ".broadcast"):
                // console.log(msg);
                if (isQuotedDocument) {
                    let _title = msg.message.extendedTextMessage?.contextInfo.quotedMessage.documentMessage.title;
                    // let _type = msg.message.extendedTextMessage?.contextInfo.quotedMessage.documentMessage.mimetype;
                    stream = await downloadContentFromMessage(msg.message.extendedTextMessage?.contextInfo.quotedMessage.documentMessage, 'document');

                    // Create Buffer from Stream Data
                    buffer = Buffer.from([])
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk])
                    }
                    // if (_type != 'application/pdf')
                    fs.writeFileSync(`./temp/${_title}`, buffer)

                    // Read Excel 
                    const workbook = XLSX.readFile(`./temp/${_title}`);

                    // Pilih sheet yang ingin dibaca
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];

                    // Mendapatkan data dari kolom 'Nama' dan 'Nomor'
                    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    const _nama = data[0].indexOf('Nama');
                    const _receiver = data[0].indexOf('Nomor');
                    const _message = data[0].indexOf('Message');


                    for (let i = 1; i < data.length; i++) {
                        // console.log(`Nama = ${data[i][_nama]} | Nomor = ${data[i][_receiver]} | pesan = ${data[i][_message].replace('{Nama}',data[i][_nama])}`)

                        simpleSendMessage(shelterSock, `${data[i][_receiver]}@s.whatsapp.net`, `${data[i][_message].replace('{Nama}', data[i][_nama])}`)
                    }

                    fs.unlink(filePath, (err) => {
                        if (err) {
                          console.error('Gagal menghapus file:', err);
                          return;
                        }
                      
                        console.log('File berhasil dihapus');
                      });
                }
                break
        }

    }catch(e){
        console.log(e);
    }
};