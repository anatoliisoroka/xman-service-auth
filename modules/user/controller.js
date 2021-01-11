//imports
//npm libraries
const { Op } = require('sequelize');
const axios = require('axios');
require('dotenv').config();

const { validate: uuidValidate } = require('uuid');

//local libraries
const { httpStatus, getStatus, getTeamSpecificAdminScopeList, getNotification, getOauthConfig  } = require('../../utilities/constants');

const { sendEmail } = require('../../utilities/sendgrid');
const { convertToUniqueArray, convertArrayScopeToBinary } = require('../../utilities/converters');
const { generateAccessToken } = require('../../utilities/tokens')
const { convertToFormattedNumber } = require('../../utilities/converters')

//models
const User = require('../../models/users');
const userFunc = new User();
const Team = require('../../models/teams');
const TeamMember = require('../../models/teamMembers');

/**
 * @param {int} limit
 * max count of the returned rows
 * @param {int} offset
 * where to start the count
 * @param {boolean} all 
 * for admin use only. Will allow the admin to fetch all user refresh token
 * @param {string} id
 * for admin use only. Will allow the admin to fetch a specific user
 */
exports.getUsers = async (req, res) => {
    const { limit, offset, q, all, id } = req.query;

    try {

        //fetch all with admin role
        if (all === 'true' && req.user.scope.indexOf('USER_READ_ALL') >= 0) {

            var where = {};
        
            if (q) {
                where = {
                    [Op.or]: {
                        username: {
                            [Op.like]: `%${q}%`
                        },
                    }
                };
            }
        
            if (uuidValidate(q)) {
                where[Op.or].id = q;
            }
    
            const users = await User.findAll({
                where: where,
                attributes: [
                    'id', 
                    'created', 
                    'modified', 
                    'username', 
                    'status', 
                    'role',
                    'access',
                    'emailAddress',
                    'contactNumber'
                ],
                order: [
                    ['created', 'ASC']
                ],
                limit: limit,
                offset: offset
            });
    
            res.set({
                'Access-Control-Expose-Headers': 'Content-Range',
                'Content-Range': `bytes ${parseInt(offset) + 1}-${parseInt(limit) + parseInt(offset)}/${await User.count({
                    where: where
                })}`
            });
    
            return res.status(200).json( { status: httpStatus.success, message: 'Successfully fetched the users', code: 200, meta: users } );

        }


        //fetch one user by id specific if exists
        if (id) {
            if (!uuidValidate(id)) {
                return res.status(400).json( { status: httpStatus.error, message: 'The id is invalid.', code: 400 } );
            }
        }

        //fetch user profile
        var user = await User.findOne({
            where: {
                id: {
                    [Op.eq]: id && req.user.scope.indexOf('USER_READ_ALL') >= 0 ? id : req.user.user.id
                }
            },
            attributes: [
                'id', 
                'created', 
                'modified', 
                'username', 
                'status', 
                'role',
                'access',
                'emailAddress',
                'contactNumber',
            ],
            order: [
                ['created', 'ASC']
            ]
        });

        return res.status(200).json( { status: httpStatus.success, message: 'Successfully fetched the user/s', code: 200, meta: user } );
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while fetching the user/s: ${error.message}`, code: 500 } );
    }
}

exports.createUser = async (req, res) => {  
    const { username, password, status, emailAddress, access, contactNumber, isSendCredentialsToEmail, isSendCredentialsToWa } = req.body;

    try {
        
        var user = await User.create({
            username: username,
            password: await userFunc.generatePasswordHash(password),
            status: !status ? 1 : getStatus.indexOf(status.toLowerCase()),
            access: access,
            emailAddress: emailAddress === undefined ? null : emailAddress,
            contactNumber: contactNumber === undefined ? null : convertToFormattedNumber(contactNumber),
        });

        //create a default team
        const team = await Team.create({
            name: `${username}'s team`,
            status: 1
        });

        await TeamMember.create({
            userId: user.id,
            teamId: team.id,
            role: 0,
            access: getTeamSpecificAdminScopeList,
            isOriginal: true
        });

        user = user.toJSON();

        delete user.password;
        delete user.salt;
        delete user.teamId;
        delete user.team_role;

        var is_email_sent = false;

        if (isSendCredentialsToEmail && emailAddress) {
            //send the credential to the email
            //call email service
            try {

                const subject = getNotification.user.email.subject;
                const body = getNotification.user.email.body.replace(/{{username}}/g, username).replace(/{{password}}/g, password);
                if (
                    !await sendEmail(emailAddress, process.env.GMAIL_EMAIL, process.env.GMAIL_NAME, subject, body)
                ) {
                    res.status(500).json( { status: httpStatus.error, message: 'There was a problem encountered when sending email but the account is created.', code: 500 } );
                }
                
                is_email_sent = true;
            } catch (error) {
                res.status(500).json( { status: httpStatus.error, message: `Error encountered: ${error.message}`, code: 500 } ); 
            }
        }
        
        //send credentials to whatsapp
        if (isSendCredentialsToWa && contactNumber) {
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
                if (is_email_sent) {
                    return res.status(500).json( { status: httpStatus.error, message: `Successful sending of email notification but whatsapp notification failed due to: Encountered an error while retrieving wa admin details.`, code: 500 } );
                }

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
    
                const response = await axios.request({
                    url:  `/messages/${jid}`,
                    baseURL: process.env.WA_URL,
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    params: {
                        access_token: token
                    },
                    data: 
                    {
                        jid: jid,
                        text: getNotification.user.wa.text.replace(/{{username}}/g, username).replace(/{{password}}/g, password)
                    }
                });
        
            } catch (error) {
                if (is_email_sent) {
                    return res.status(500).json( { status: httpStatus.error, message: `Successful sending of email notification but whatsapp notification failed due to: ${error.message}`, code: 500 } );
                }
    
                return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while sending whatsapp notification: ${error.message}`, code: 500 } );
            }

        }
        return res.status(200).json( { status: httpStatus.success, message: 'Successfully created the user', code: 200, meta: user } );

    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while creating the user: ${error.message}`, code: 500 } );
    }
}

exports.updateUser = async (req, res) => {
    //update user
    const { id, username, password, status, access, emailAddress, contactNumber } = req.body;

    var userData;
    if (password) {
        userData = {
            username: username,
            password: await userFunc.generatePasswordHash(password),
        };
    } else {
        userData = {
            username: username
        };
    }

    if (emailAddress || emailAddress === '' || emailAddress === null) {
        userData.emailAddress = emailAddress === '' ? null : emailAddress
    }

    if (contactNumber || contactNumber === '' || contactNumber === null) {
        userData.contactNumber = contactNumber === '' || contactNumber === null ? null : convertToFormattedNumber(contactNumber)
    }

    //for admin role update
    if (req.user.scope.indexOf('USER_UPDATE_ALL') >= 0) {
        if (status) {
            userData.status = getStatus.indexOf(status.toLowerCase());
        }

        if (access) {
            userData.access = access;
        }
    }

    try {
        await User.update(
            userData,
            {
                where: {
                    id: {
                        [Op.eq]: id && req.user.scope.indexOf('USER_UPDATE_ALL') >= 0 ? id : req.user.user.id
                    }
                }
            }
        );

        return res.status(200).json( { status: httpStatus.success, message: 'Successfully updated the user', code: 200 } );
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while updating the user: ${error.message}`, code: 500 } );
    }
}

exports.deleteUser = async (req, res) => {

    const { id } = req.query;

    try {

        await User.destroy({
            where: {
                id: {
                    [Op.eq]: id
                }
            }
        });

        if(process.env.WA_LOGOUT_ON_DELETE && process.env.WA_LOGOUT_ON_DELETE.toLowerCase() === 'true'){
            const membership = await TeamMember.findOne({
                where: {
                    userId: {
                        [Op.eq]: id
                    },
                    isOriginal: {
                        [Op.eq]: true
                    }
                }
            });
            
            //call api-wa logout
            if(membership && membership.teamId) {
                var exp = Math.floor((new Date().getTime() + (( getOauthConfig.accessTokenLifetime / 60) * 60 * 1000)) / 1000);
                //api-wa logout
                const token = generateAccessToken(
                    { 
                        id: req.user.user.id, 
                        username: req.user.user.username,
                        teamId: membership.teamId
                    },
                    req.user.scope,
                    exp
                )

                await axios.request({
                    url:  `/logout`,
                    baseURL: process.env.WA_URL,
                    method: 'get',
                    params: {
                        access_token: token
                    }
                });
            }
        }

        return res.status(200).json( { status: httpStatus.success, message: 'Successfully deleted the user', code: 200 } );
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while deleting the user: ${error.message}`, code: 500 } );
    }

}