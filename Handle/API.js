const app = require('express')();
const port = 4000;

app.listen(port, () => {
    console.log(`its Running on http://localhost:${port}`);
})

module.exports = async (ShelterSock) => {
    try{
        app.get('/send', async (req, res) => {
            const toNumber = "6282273726295@@s.whatsapp.net"
            // const sendMsg = await shelterSock.sendMessage(toNumber, {
            //     text: "Hay Dari API"
            // })
            res.send('hay')
        })
    }catch(e){
        console.log(e);
    }
};