//imports
//npm libraries
const { Op } = require('sequelize');
const axios = require('axios');
require('dotenv').config();

//local libraries
const { httpStatus, getRegularScopeList, getNotification, getOauthConfig } = require('../../utilities/constants');
const { sendEmail } = require('../../utilities/sendgrid');
const { convertToUniqueArray, convertArrayScopeToBinary } = require('../../utilities/converters');
const { convertToFormattedNumber } = require('../../utilities/converters')

const { generateAccessToken } = require('../../utilities/tokens')

//models
const User = require('../../models/users');
const TeamMember = require('../../models/teamMembers');
const userFunc = new User();

exports.getTeamMembers = async (req, res) => {
    const { team_id, limit, offset } = req.query;

    try {

        const members = await TeamMember.findAll({
            where: {
                teamId: {
                    [Op.eq]: team_id ? team_id : req.user.user.teamId
                }
            },
            attributes: [
                'id', 
                'created', 
                'modified', 
                'is_default',
                'is_original',
                'teamId',
                'userId',
                'access'
            ],
            include: [
                {
                    model: User,
                    required: true,
                    attributes: [
                        'id', 
                        'created', 
                        'modified', 
                        'username', 
                        'status',
                    ],
                }
            ],
            order: [
                ['created', 'ASC']
            ],
            limit: limit,
            offset: offset
        });

        return res.status(200).json( { status: httpStatus.success, message: 'Successfully fetched the team members', code: 200, meta: members } );
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while fetching the team members: ${error.message}`, code: 500 } );
    }
}

exports.addTeamMember = async (req, res) => {
    const { team_id, username, password, access, emailAddress, contactNumber, isSendCredentialsToEmail, isSendCredentialsToWa  } = req.body;

    try {
        //create a new user then add to the team
        const userAccess = getRegularScopeList;
        //this will only apply to temporary membership
        userAccess.splice(userAccess.indexOf('TEAM_LINK_JOIN'), 1);
        
        var user = await User.create({
            username: username,
            password: await userFunc.generatePasswordHash(password),
            status: 1,
            access: getRegularScopeList.splice(getRegularScopeList.indexOf('TEAM_LINK_JOIN'), 1),
            isTemporary: true,
            emailAddress: emailAddress === undefined ? null : emailAddress,
            contactNumber: contactNumber === undefined ? null : convertToFormattedNumber(contactNumber)
        });

        const member = await TeamMember.findOne({
            where: {
                teamId: {
                    [Op.eq]: team_id ? team_id : req.user.user.teamId
                },
                userId: {
                    [Op.eq]: user.id
                }
            }
        });

        if (member) {
            return res.status(400).json( { status: httpStatus.error, message: 'The user already belong to this team. Try updating the member instead.', code: 400 } );
        }

        await TeamMember.create(
            {
                teamId: team_id ? team_id : req.user.user.teamId,
                userId: user.id,
                access: access,
                isDefault: await TeamMember.count(
                    { 
                        where: 
                        { 
                            userId: {
                                [Op.eq]: user.id
                            } 
                        }                     
                    }
                ) > 0 ? false : true,
                isOriginal: await TeamMember.count(
                    { 
                        where: 
                        { 
                            userId: {
                                [Op.eq]: user.id
                            } ,
                            isOriginal: {
                                [Op.eq]: true
                            }
                        }                     
                    }
                ) > 0 ? false : true
            }
        );

        user = user.toJSON();

        delete user.password;
        delete user.salt;
        delete user.teamId;
        delete user.team_role;
        delete user.access;

        var is_email_sent = false;
        //send credentials to email
        if (emailAddress && isSendCredentialsToEmail) {
            //send the credential to the email
            //call email service
            try {

                const subject = getNotification.member.email.subject;
                const body = getNotification.member.email.body.replace(/{{username}}/g, username).replace(/{{password}}/g, password);
                if (
                    !await sendEmail(emailAddress, process.env.GMAIL_EMAIL, process.env.GMAIL_NAME, subject, body)
                ) {
                    res.status(500).json( { status: httpStatus.error, message: 'There was a problem encountered when sending email but the member is created.', code: 500 } );
                }
                
                is_email_sent = true;
            } catch (error) {
                res.status(500).json( { status: httpStatus.error, message: `Error encountered: ${error.message}`, code: 500 } ); 
            }
        }

        //send credentials to whatsapp
        if (contactNumber && isSendCredentialsToWa) {
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
                    data: {
                        jid: jid,
                        text: getNotification.member.wa.text.replace(/{{username}}/g, username).replace(/{{password}}/g, password)
                    }
                });
        
            } catch (error) {
                if (is_email_sent) {
                    return res.status(500).json( { status: httpStatus.error, message: `Successful sending of email notification but whatsapp notification failed due to: ${error.message}`, code: 500 } );
                }
    
                return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while sending whatsapp notification: ${error.message}`, code: 500 } );
            }
        }
    
        return res.status(200).json( { status: httpStatus.success, message: 'Successfully added the user to the team', code: 200, meta: user } );

    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while adding the user to the team: ${error.message}`, code: 500 } );
    }

}

exports.updateTeamMember = async (req, res) => {
    const { team_id, user_id, access } = req.body;

    try {
        //add existing user to the team
        const member = await TeamMember.findOne({
            where: {
                teamId: {
                    [Op.eq]: team_id ? team_id : req.user.user.teamId
                },
                userId: {
                    [Op.eq]: user_id
                }
            }
        });

        var meta = {};
        if (member) {
            await member.update(
                {
                    access: access,
                    isDefault: await TeamMember.count(
                        { 
                            where: 
                            { 
                                userId: {
                                    [Op.eq]: user_id
                                },
                                id: {
                                    [Op.ne]: member.id
                                },
                                isDefault: {
                                    [Op.eq]: true
                                }
                            }                     
                        }
                    ) > 0 ? false : true
                }
            );
            meta = member;
        } else {
            
            meta = await TeamMember.create(
                {
                    teamId: team_id ? team_id : req.user.user.teamId,
                    userId: user_id,
                    access: access,
                    isDefault: await TeamMember.count(
                        { 
                            where: 
                            { 
                                userId: {
                                    [Op.eq]: user_id
                                },
                                isDefault: {
                                    [Op.eq]: true
                                } 
                            }                     
                        }
                    ) > 0 ? false : true
                }
            );
        }

        return res.status(200).json( { status: httpStatus.success, message: 'Successfully added/updated the team member', code: 200, meta } );
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while adding the user to the team: ${error.message}`, code: 500 } );
    }

}

exports.deleteTeamMember = async (req, res) => {
    //member was assigned in the middleware
    const { team_id, user_id } = req.query;

    try {
        const member = await TeamMember.findOne({
            where: {
                teamId: {
                    [Op.eq]: team_id ? team_id : req.user.user.teamId
                },
                userId: {
                    [Op.eq]: user_id
                }
            }
        });

        if (member.isDefault) {
            const originalMembership = await TeamMember.findOne({
                where: {
                    userId: member.userId,
                    isOriginal: true
                }
            });

            if (originalMembership) {
                await TeamMember.update(
                    {
                        isDefault: true
                    },
                    {
                        where: {
                            id: originalMembership.id
                        }
                    }
                )
            } else {
                const temporaryOriginalMembership = await TeamMember.findOne({
                    where: {
                        userId: member.userId,
                    },
                    order: [['created', 'asc']]
                });

                if (temporaryOriginalMembership) {
                    await TeamMember.update(
                        {
                            isDefault: true
                        },
                        {
                            where: {
                                id: temporaryOriginalMembership.id
                            }
                        }
                    )
                }
            }
        }

        await TeamMember.destroy(
            {
                where: {
                    userId: {
                        [Op.eq]: user_id
                    },
                    teamId: {
                        [Op.eq]: team_id ? team_id : req.user.user.teamId
                    }
                },
                force: true
            }
        );

        if (
            await User.count({
                where: {
                    id: {
                        [Op.eq]: user_id
                    },
                    isTemporary: true
                }
            }) > 0 
        ) {
            await User.destroy({
                where: {
                    id: {
                        [Op.eq]: user_id
                    }
                },
                force: true
            });
        }

        return res.status(200).json( { status: httpStatus.success, message: 'Successfully deleted the team member', code: 200} );
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while deleting the team member: ${error.message}`, code: 500 } );
    }

}