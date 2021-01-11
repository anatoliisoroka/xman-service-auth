//imports
//npm libraries
const { Op } = require('sequelize');
require('dotenv').config();

//local libraries
const { httpStatus, getOauthConfig, getNotification } = require('../../utilities/constants');
const { sendEmail } = require('../../utilities/sendgrid');
const { convertToUniqueArray, convertArrayScopeToBinary } = require('../../utilities/converters');
const { generateAccessToken } = require('../../utilities/tokens')
const { sendMessage } = require('../../utilities/whatsapp')

//models
const User = require('../../models/users');
const TeamMember = require('../../models/teamMembers');

exports.notify = async (req, res) => {
    const { event, data, isNotifyEmail, emailAddress, isNotifyWa, contactNumber } = req.body;

    var emailTitle = '';
    var emailContent = '';
    var waTitle = '';
    var waContent = '';
    var is_notify = false;

    if (event.toLowerCase() === 'open') {
        if (data.newConnection) {
            emailTitle = getNotification.wa_hook.email.new_connection.subject;
            emailContent = getNotification.wa_hook.email.new_connection.body.replace('{{phone_number}}', contactNumber);
            waTitle = getNotification.wa_hook.wa.new_connection.subject;
            waContent = getNotification.wa_hook.wa.new_connection.body.replace('{{phone_number}}', contactNumber);
            is_notify = true;
        }
    }

    if (event.toLowerCase() === 'close') {
        if (!data.isReconnecting && data.reason !== 'intentional' && data.reason !== 'end') {
            emailTitle = getNotification.wa_hook.email[data.reason] && getNotification.wa_hook.email[data.reason].subject || getNotification.wa_hook.email.disconnection.subject;
            emailContent =  getNotification.wa_hook.email[data.reason] && getNotification.wa_hook.email[data.reason].body  || getNotification.wa_hook.email.disconnection.body
            waTitle = getNotification.wa_hook.wa[data.reason] && getNotification.wa_hook.wa[data.reason].subject || getNotification.wa_hook.wa.disconnection.subject;
            waContent =  getNotification.wa_hook.wa[data.reason] && getNotification.wa_hook.wa[data.reason].body  || getNotification.wa_hook.wa.disconnection.body
            is_notify = true;
        }
    }

    var is_email_sent = false;

    if (is_notify && isNotifyEmail && emailAddress) {
        //call email service
        try {
            if (
                !await sendEmail(emailAddress, process.env.GMAIL_EMAIL, process.env.GMAIL_NAME, emailTitle, emailContent)
            ) {
                res.status(500).json( { status: httpStatus.error, message: 'There was a problem encountered when sending email.', code: 500 } );
            }
            
            is_email_sent = true;
        } catch (error) {
            res.status(500).json( { status: httpStatus.error, message: `Error encountered: ${error.message}`, code: 500 } ); 
        }

    }

    if (is_notify && isNotifyWa && contactNumber) {
        //call whats app service

        const wa_admin = await User.findOne({
            where: {
                username: {
                    [Op.eq]: process.env.WA_ADMIN_USERNAME || 'service-wa'
                }
            },
            include: 
            {
                model: TeamMember,
                attributes: [
                    'teamId',
                    'role',
                    'access'
                ],
                where: {
                    isDefault: {
                        [Op.eq]: true
                    }
                },
                limit: 1,
            },
        });

        if (!wa_admin) {
            return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while retrieving wa admin details.`, code: 500 } );
        }

        try {

            var exp = Math.floor((new Date().getTime() + (( getOauthConfig.accessTokenLifetime / 60) * 60 * 1000)) / 1000);

            const scopes = convertToUniqueArray([wa_admin.access || [], wa_admin.team_members[0].access || []]);
    
            const token = generateAccessToken(
                { 
                    id: req.user.user.id, 
                    username: req.user.user.username,
                    teamId: wa_admin.team_members[0].teamId 
                },
                convertArrayScopeToBinary(scopes),
                exp
            )

            const jid = `${contactNumber.replace('+', '')}${process.env.WA_ID_EXT}`;

            // send whatsapp message
            await sendMessage(token, jid, waTitle, waContent)
    
        } catch (error) {
            if (is_email_sent) {
                return res.status(500).json( { status: httpStatus.error, message: `Successful sending of email notification but whatsapp notification failed due to: ${error.message}`, code: 500 } );
            }

            return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while sending whatsapp notification: ${error.message}`, code: 500 } );
        }
    }

    return res.status(200).json( { status: httpStatus.success, message: 'Successfully notify the team', code: 200 } );
}