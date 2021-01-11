const sgMail = require('@sendgrid/mail')
require('dotenv').config();

exports.sendEmail = async (to, from, fromname, subject, html) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    return await sgMail
    .send(
        {
            to,
            from: {
                email: from,
                name: fromname
            },
            subject,
            html
        }
    )
    .then(
        () => {
            console.log('Email Sent')
            return true
        }
    )
    .catch(
        (error) => {
            console.error(error)
            return false
        }
    )
}