//imports
//npm libraries
const { Op } = require('sequelize');
const { validate: uuidValidate } = require('uuid');

//local libraries
const { httpStatus, getStatus, getTeamRoles, getTeamSpecificAgentScopeList } = require('../../utilities/constants');

//models
const Team = require('../../models/teams');
const User = require('../../models/users');
const TeamMember = require('../../models/teamMembers');
const teamFunc = new Team();

exports.getTeams = async (req, res) => {

    const { limit, offset, q, all, is_default, is_original, id, invite_code, request_type, user_id, condition } = req.query;

    try {

        var whereKey = Op.and;
        var where = {[whereKey]: {}};
        var where2 = {[whereKey]: {}};

        if (condition === 'or') {
            //expect to return multiple rows
            whereKey = Op.or;
        }

        //team specific query
        if (q || id || invite_code) {
            where = {
                [whereKey]: {}
            }
        }

        if (q) {

            where[whereKey].name = {
                [Op.like]: `%${q}%`
            };

            where[whereKey].emailAddress = {
                [Op.like]: `%${q}%`
            };

            where[whereKey].contactNumber = {
                [Op.like]: `%${q}%`
            };

            where[whereKey].inviteCode = {
                [Op.like]: `%${q}%`
            };
        }

        if (uuidValidate(q)) {
            where[whereKey].id = q;
        }

        if (id) {
            if (uuidValidate(id)) {
                where[whereKey].id = id;
            }
        }

        if (invite_code) {
            where[whereKey].inviteCode = invite_code;
        }

        //member specific query
        if (user_id || is_default || is_original) {
            where2 = {
                [whereKey]: {}
            }
        }

        if (is_default === 'true') {
            where2[whereKey].isDefault = true;
        }

        if (is_default === 'false') {
            where2[whereKey].isDefault = false;
        }

        if (is_original === 'true') {
            where2[whereKey].isOriginal = true;
        }

        if (is_original === 'false') {
            where2[whereKey].isOriginal = false;
        }

        var teams = [];

        if (req.user.scope.indexOf('TEAM_READ_ALL') >= 0 && request_type === "admin") {
            //admin role capabilities
            //fetch all teams
            teams = await Team.findAll({
                where: where,
                order: [
                    ['created', 'ASC']
                ], 
                attributes: [
                    'id',
                    'created',
                    'modified',
                    'name',
                    'invite_code',
                    'is_link_sharing_enabled',
                    'isNotifyEmail',
                    'isNotifyWa',
                    'status', 
                ],
                limit: limit,
                offset: offset
            });
    
            res.set({
                'Access-Control-Expose-Headers': 'Content-Range',
                'Content-Range': `bytes ${parseInt(offset) + 1}-${parseInt(limit) + parseInt(offset)}/${await Team.count({where})}`
            });
    
            return res.status(200).json( { status: httpStatus.success, message: 'Successfully fetched the teams', code: 200, meta: teams } );
        }

        where2[whereKey].userId = req.user.user.id;
        if (user_id && req.user.scope.indexOf('TEAM_READ_ALL') >= 0) {
            if(!uuidValidate(user_id)) {
                return res.status(400).json( { status: httpStatus.error, message: 'The user_id is invalid.', code: 400 } );
            }

            where2[whereKey].userId = user_id;
        }

        //fetch a user specific teams or via user_id filter
        teams = await TeamMember.findAll({
            where: where2, 
            attributes: [
                'id', 
                'created', 
                'modified', 
                'is_default', 
                'userId',
                'teamId',
                'is_original',
                'access'
            ],
            order: [
                ['created', 'ASC']
            ],
            include: [
                {
                    model: Team,
                    required: true,
                    attributes: [
                        'id',
                        'created',
                        'modified',
                        'name',
                        'invite_code',
                        'is_link_sharing_enabled',
                        'isNotifyEmail',
                        'isNotifyWa',
                        'status', 
                    ],
                    where: where
                }
            ],
            limit: limit,
            offset: offset
        });

        res.set({
            'Access-Control-Expose-Headers': 'Content-Range',
            'Content-Range': `bytes ${parseInt(offset) + 1}-${parseInt(limit) + parseInt(offset)}/${await TeamMember.count({where2})}`
        })  
        return res.status(200).json( { status: httpStatus.success, message: 'Successfully fetched the team', code: 200, meta: teams } ) 
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while fetching the teams: ${error.message}`, code: 500 } );
    }

}

exports.createTeam = async (req, res) => {
    const { name, notify_email, notify_wa, status } = req.body;

    try {

        const team = await Team.create({
            name: name,
            isNotifyEmail: notify_email === undefined ? true : notify_email,
            isNotifyWa: notify_wa === undefined ? true : notify_wa,
            status: !status ? 1 : getStatus.indexOf(status.toLowerCase())
        });

        return res.status(200).json( { status: httpStatus.success, message: 'Successfully created the team', code: 200, meta: team } );
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while creating the team: ${error.message}`, code: 500 } );
    }

}

exports.modifyTeam = async (req, res) => {  
    const { id, name, notify_email, notify_wa, status } = req.body;

    var teamData = {
        name: name
    };

    if (notify_email !== undefined) {
        teamData.isNotifyEmail = notify_email;
    }

    if (notify_wa !== undefined) {
        teamData.isNotifyWa = notify_wa;
    }

    if (status) {
        teamData.status = getStatus.indexOf(status.toLowerCase());
    }

    try {
        await Team.update(
            teamData,
            {
                where: {
                    id: {
                        [Op.eq]: id ? id : req.user.user.teamId
                    }
                }
            }
        );
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while updating the team: ${error.message}`, code: 500 } );
    }

    return res.status(200).json( { status: httpStatus.success, message: 'Successfully updated the team', code: 200 } );
}

exports.deleteTeam = async (req, res) => {

    const { id } = req.query;

    try {

        const members = await TeamMember.findAll({
            where: {
                teamId: {
                    [Op.eq]: id
                },
                isDefault: {
                    [Op.eq]: true
                }
            }
        });

        await members.map(
            async member => {
                const d = await TeamMember.findOne({
                    where: {
                        userId: {
                            [Op.eq]: member.userId
                        },
                        isOriginal: {
                            [Op.eq]: true
                        }
                    }
                });

                if (d) {

                    await TeamMember.update(
                        {
                            isDefault: true
                        },
                        {
                            where: {
                                id: d.id
                            }
                        }
                    )

                }
            }
        )

        await TeamMember.destroy({
            where: {
                teamId: {
                    [Op.eq]: id
                }
            },
            force: true
        });
        
        await Team.destroy({
            where: {
                id: {
                    [Op.eq]: id
                }
            },
            force: true
        });

        return res.status(200).json( { status: httpStatus.success, message: 'Successfully deleted the team', code: 200 } );
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while deleting the team: ${error.message}`, code: 500 } );
    }

}

exports.switchTeam = async (req, res) => {
    const { id, user_id } = req.body;

    try {

        await TeamMember.update(
            {
                isDefault: true
            },
            {
                where: {
                    teamId: {
                        [Op.eq]: id
                    },
                    userId: {
                        [Op.eq]: user_id && req.user.scope.indexOf('TEAM_SWITCH_ALL') >= 0 ? user_id : req.user.user.id
                    }
                }
            }
        );

        await TeamMember.update(
            {
                isDefault: false
            },
            {
                where: {
                    teamId: {
                        [Op.ne]: id
                    },
                    userId: {
                        [Op.eq]: user_id && req.user.scope.indexOf('TEAM_SWITCH_ALL') >= 0 ? user_id : req.user.user.id
                    }
                }
            }
        );

        return res.status(200).json( { status: httpStatus.success, message: 'Successfully updated to default team.', code: 200} );
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while updating the default team: ${error.message}`, code: 500 } );
    }

}

exports.fetchInviteLink = async (req, res) => {
    const { id } = req.query;

    try {
        var team = await Team.findOne(
            {
                where: {
                    id: {
                        [Op.eq]: id ? id : req.user.user.teamId
                    }
                },
                attributes: [
                    "invite_code",
                    "is_link_sharing_enabled"
                ]
            }
        );

        team = team.toJSON();

        if (!team.invite_code) {

            team.invite_code = await teamFunc.generateInviteCode();
            await Team.update(
                {
                    inviteCode: team.invite_code
                },
                {
                    where: {
                        id: id ? id : req.user.user.teamId
                    }
                }
            );
        }
    
        return res.status(200).json( { status: httpStatus.success, message: 'Successfully fetched the invite link', code: 200, meta: {invite_link: `${process.env.INVITE_LINK_BASE_URL}?code=${team.invite_code}`, is_link_sharing_enabled: team.is_link_sharing_enabled } } );

    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while fetching the invite link: ${error.message}`, code: 500 } );
    }

}

exports.fetchNewInviteLink = async (req, res) => {
    const { id } = req.query;

    try {
        
        var team = {};
        team.invite_code = await teamFunc.generateInviteCode();
        await Team.update(
            {
                inviteCode: team.invite_code
            },
            {
                where: {
                    id: id ? id : req.user.user.teamId
                }
            }
        );
    
        return res.status(200).json( { status: httpStatus.success, message: 'Successfully fetched the invite link', code: 200, meta: {invite_link: `${process.env.INVITE_LINK_BASE_URL}?code=${team.invite_code}`} } );

    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while fetching the invite link: ${error.message}`, code: 500 } );
    }

}

exports.enableLinkSharing = async (req, res) => {
    const { id, is_link_sharing_enabled } = req.body;

    try {
        
        await Team.update(
            {
                isLinkSharingEnabled: is_link_sharing_enabled
            },
            {
                where: {
                    id: id ? id : req.user.user.teamId
                }
            }
        );
    
        return res.status(200).json( { status: httpStatus.success, message: `Successfully ${is_link_sharing_enabled ? 'enabled' : 'disabled'} the invite link`, code: 200 });

    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while enabling the invite link: ${error.message}`, code: 500 } );
    }

}

exports.joinTeamViaInviteCode = async (req, res) => {
    const { invite_code } = req.params;
    try {

        const team = await Team.findOne({
            where: {
                inviteCode: invite_code
            }
        });

        await TeamMember.create({
            userId: req.user.user.id,
            teamId: team.id,
            access: getTeamSpecificAgentScopeList,
            isDefault: await TeamMember.count(
                { 
                    where: 
                    { 
                        userId: {
                            [Op.eq]: req.user.user.id
                        } 
                    }                     
                }
            ) > 0 ? false : true,
            isOriginal: await TeamMember.count(
                { 
                    where: 
                    { 
                        userId: {
                            [Op.eq]: req.user.user.id
                        } ,
                        isOriginal: {
                            [Op.eq]: true
                        }
                    }                     
                }
            ) > 0 ? false : true
        });
    
        return res.status(200).json( { status: httpStatus.success, message: 'Successfully joined the team', code: 200});

    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while joining the team: ${error.message}`, code: 500 } );
    }

}

exports.getTeamsViaFilter = async (req, res) => {
    var where = {};
    if (req.query.code) {
        where.inviteCode = {
            [Op.like]: `%${req.query.code}%`
        }
    }

    try {

        const teams = await Team.findAll({
            where: where,
            attributes: [
                'id',
                'created',
                'modified',
                'name',
                'invite_code',
                'is_link_sharing_enabled',
                'isNotifyEmail',
                'isNotifyWa'
            ],
            order: [
                ['created', 'ASC']
            ],
        });

        return res.status(200).json( { status: httpStatus.success, message: 'Successfully fetched the team', code: 200, meta: teams } );
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while fetching the teams: ${error.message}`, code: 500 } );
    }

}