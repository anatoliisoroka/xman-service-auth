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

    var title = '';
    var content = '';

    var is_email_sent = false;

    if (isNotifyEmail && emailAddress) {
        title = getNotification.contacts_hook.email.subject;
        content = getNotification.contacts_hook.email.body.replace(/{{contact_list}}/g, data.phoneNumbers.join('<br>'));
        //call email service
        try {
            if (
                !await sendEmail(emailAddress, process.env.GMAIL_EMAIL, process.env.GMAIL_NAME, title, content)
            ) {
                res.status(500).json( { status: httpStatus.error, message: 'There was a problem encountered when sending email.', code: 500 } );
            }
            
            is_email_sent = true;
        } catch (error) {
            res.status(500).json( { status: httpStatus.error, message: `Error encountered: ${error.message}`, code: 500 } ); 
        }

    }

    if (isNotifyWa && contactNumber) {
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
            title = getNotification.contacts_hook.wa.subject;
            content = getNotification.contacts_hook.wa.body.replace(/{{contact_list}}/g, data.phoneNumbers.join('\n'));

            // send whatsapp message
            await sendMessage(token, jid, title, content)
    
        } catch (error) {
            if (is_email_sent) {
                return res.status(500).json( { status: httpStatus.error, message: `Successful sending of email notification but whatsapp notification failed due to: ${error.message}`, code: 500 } );
            }

            return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while sending whatsapp notification: ${error.message}`, code: 500 } );
        }
    }

    return res.status(200).json( { status: httpStatus.success, message: 'Successfully notify the assignee', code: 200 } );
}