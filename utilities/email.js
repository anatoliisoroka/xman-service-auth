//imports
//npm libraries
const {OAuth2Client} = require('google-auth-library');
const {google} = require('googleapis');
const fs = require('fs');
const readline = require('readline');

//local libraries
const { getGoogleTokenPath, getGoogleCredentialsPath } = require('./constants');

exports.makeEmailBody = (to, from, fromName, subject, message) => {
    var str = `Content-Type: text/html; charset="UTF-8"\nMIME-Version: 1.0\nto: ${to}\nfrom: ${fromName} <${from}>\nsubject: ${subject}\n\n${message}`;
    
    return new Buffer.from(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
}
exports.sendMail = async (auth, body) => {
    const gmail = google.gmail({version: 'v1', auth});
    return await gmail.users.messages.send({
        userId: 'me',
        resource: {
            raw: body
        }
    }).then( result => {
        return true;
    }).catch( err => {
        console.log(err);
        return false;
    })
}

exports.getOauth2Client = () => {
    try {
        const credentials = JSON.parse(fs.readFileSync(getGoogleCredentialsPath));
        const {client_secret, client_id, redirect_uris} = credentials.web;
        const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

        const tokens = JSON.parse(fs.readFileSync(getGoogleTokenPath));
        oAuth2Client.setCredentials(tokens);
        return oAuth2Client;
    } catch (error) {
        console.log(error);
        return undefined;
    }
}
