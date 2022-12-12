const app = require('express')();
const port = 4000;

app.listen(port, () => {
    console.log(`WEB API is Running on http://localhost:${port}`);
})

module.exports = async (shelterSock) => {
    try{
        app.get('/sendMessage', async (req, res) => {
            let request = {
                chatID: req.query.chatID,
                message: req.query.message
            }
            let chatID = request.chatID + "@s.whatsapp.net";
            const sendMsg = await shelterSock.sendMessage(chatID, {
                text: request.message
            })
            res.send(sendMsg)
        })
    }catch(e){
        console.log(e);
    }
};