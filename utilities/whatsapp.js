const axios = require('axios');
require('dotenv').config();

exports.sendMessage = async (token, jid, title, content) => {

    return await axios.request({
        url:  `/messages/${jid}`,
        baseURL: process.env.WA_URL,
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        params: {
            access_token: token
        },
        data: {
            jid: jid,
            text: `*${title}*\n\n${content}`
        }
    });
}