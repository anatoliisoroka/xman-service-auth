//imports
//npm libraries

const { validate: uuidValidate } = require('uuid');

//local libraries
const { httpStatus, getStatus, getTeamRoles } = require('../../utilities/constants');

//model
var Team = require('../../models/teams');
var teamFunc = new Team();
var User = require('../../models/users');
const TeamMember = require('../../models/teamMembers');
const { Op } = require('sequelize');
const userFunc = new User();

exports.validateTeamCreation = async (req, res, next) => {
    const { name, notify_email, notify_wa, status } = req.body;

    if (!name) {
        return res.status(400).json({ status: httpStatus.error, message: 'The name field is required.', code: 400 });
    }

    if (!teamFunc.isValidName(name)) {
        return res.status(400).json({ status: httpStatus.error, message: 'The name format is not valid.', code: 400 });
    }

    if (notify_email) {
        if (typeof notify_email !== "boolean") {
            return res.status(400).json({ status: httpStatus.error, message: 'The notify_email field is not boolean.', code: 400 });
        }
    }

    if (notify_wa) {
        if (typeof notify_wa !== "boolean") {
            return res.status(400).json({ status: httpStatus.error, message: 'The notify_wa field is not boolean.', code: 400 });
        }
    }

    if (status) {
        if (typeof status !== "string") {
            return res.status(400).json({ status: httpStatus.error, message: 'The status field must be string.', code: 400 });
        }

        if (getStatus.indexOf(status.toLowerCase()) == -1) {
            return res.status(400).json({ status: httpStatus.error, message: 'The status field is not valid.', code: 400 });
        }
    }
    
    return next();
}

exports.validateTeamModification = async (req, res, next) => {
    const { id, name, notify_email, notify_wa, status } = req.body;

    if (!name) {
        return res.status(400).json({ status: httpStatus.error, message: 'The name field is required.', code: 400 });
    }

    if (!teamFunc.isValidName(name)) {
        return res.status(400).json({ status: httpStatus.error, message: 'The name format is not valid.', code: 400 });
    }

    if (notify_email !== undefined) {
        if (typeof notify_email !== "boolean") {
            return res.status(400).json({ status: httpStatus.error, message: 'The notify_email field is not boolean.', code: 400 });
        }
    }

    if (notify_wa !== undefined) {
        if (typeof notify_wa !== "boolean") {
            return res.status(400).json({ status: httpStatus.error, message: 'The notify_wa field is not boolean.', code: 400 });
        }
    }

    if (status) {
        if (typeof status !== "string") {
            return res.status(400).json({ status: httpStatus.error, message: 'The status field must be a string.', code: 400 });
        }

        if (getStatus.indexOf(status.toLowerCase()) == -1) {
            return res.status(400).json({ status: httpStatus.error, message: 'The status field is not valid.', code: 400 });
        }
    }

    if (id) {
        if (!uuidValidate(id)) {
            return res.status(400).json({ status: httpStatus.error, message: 'The id field format is not valid.', code: 400 });
        }
    }

    const team = await Team.findOne({
        where: { id: id ? id : req.user.user.teamId }
    })

    if (
        !team
    ) {
        return res.status(400).json({ status: httpStatus.error, message: 'The id is not valid.', code: 400 });
    }

    if (req.user.scope.indexOf('TEAM_UPDATE_ALL') === -1) {
        //check if the user is part of the team
        const membership = await TeamMember.findOne({
            where: {
                teamId: team.id,
                userId: req.user.user.id
            }
        });

        if (
            !membership
        ) {
            return res.status(400).json({ status: httpStatus.error, message: 'The user is not a member of the team.', code: 400 });
        }

        //allow only admin and editor to edit
        if (
            !membership.access || !Array.isArray(membership.access) || membership.access.indexOf('TEAM_UPDATE_ASSIGNED')
        ) {
            return res.status(400).json({ status: httpStatus.error, message: 'The user is not authorized to process the request.', code: 401 });
        }

    }

    return next();
}

exports.validateTeamDelete = async (req, res, next) => {
    const { id } = req.query;

    if(!id) {
        return res.status(400).json({ status: httpStatus.error, message: 'The id field is required.', code: 400 });
    }

    if (!uuidValidate(id)) {
        return res.status(400).json({ status: httpStatus.error, message: 'The id field is invalid.', code: 400 });
    }

    if (
        await Team.count( { where: { id: id } } ) <= 0
    ) {
        return res.status(400).json({ status: httpStatus.error, message: 'The id field is not valid.', code: 400 });
    }
    
    return next();
}

exports.validateTeamSwitch = async (req, res, next) => {

    const { id, user_id } = req.body;

    if (!id) {
        return res.status(400).json( { status: httpStatus.success, message: 'The id field is required.', code: 400 } );
    }

    if (!uuidValidate(id)) {
        return res.status(400).json({ status: httpStatus.error, message: 'The id is invalid.', code: 400 });
    }

    if (user_id) {
        if (!uuidValidate(user_id)) {
            return res.status(400).json({ status: httpStatus.error, message: 'The user id is invalid.', code: 400 });
        }
    }

    if (
        await TeamMember.count({
            where: {
                teamId: id,
                userId: user_id && req.user.scope.indexOf('TEAM_SWITCH_ALL') >= 0 ? user_id : req.user.user.id
            }
        }) <= 0
    ) {
        return res.status(403).json({ status: httpStatus.error, message: 'The user is not allowed to access this team details.', code: 403 });
    }
    
    return next();
}

exports.validateTeamLink = async (req, res, next) => {

    const { id } = req.query;

    if (id) {
        if (!uuidValidate(id)) {
            return res.status(400).json({ status: httpStatus.error, message: 'The id is invalid.', code: 400 });
        }
    }

    if (
        await Team.count({
            where: {
                id: id ? id : req.user.user.teamId
            }
        }) <= 0
    ) {
        return res.status(403).json({ status: httpStatus.error, message: 'The id is not valid.', code: 403 });
    }

    if (req.user.scope.indexOf('TEAM_LINK_READ_ALL') === -1) {

        if (
            await TeamMember.count({
                where: {
                    teamId: id ? id : req.user.user.teamId,
                    userId: req.user.user.id
                }
            }) <= 0
        ) {
            return res.status(403).json({ status: httpStatus.error, message: 'The user is not allowed to access this team details.', code: 403 });
        }
    }
    
    return next();
}

exports.validateTeamNewLink = async (req, res, next) => {

    const { id } = req.query;

    if (id) {
        if (!uuidValidate(id)) {
            return res.status(400).json({ status: httpStatus.error, message: 'The id is invalid.', code: 400 });
        }
    }

    if (
        await Team.count({
            where: {
                id: id ? id : req.user.user.teamId
            }
        }) <= 0
    ) {
        return res.status(403).json({ status: httpStatus.error, message: 'The id is not valid.', code: 403 });
    }

    if (req.user.scope.indexOf('TEAM_LINK_UPDATE_ALL') === -1) {

        if (
            await TeamMember.count({
                where: {
                    teamId: id ? id : req.user.user.teamId,
                    userId: req.user.user.id,
                    access: {
                        [Op.contains]: ['TEAM_LINK_UPDATE_ASSIGNED']
                    }
                }
            }) <= 0
        ) {
            return res.status(403).json({ status: httpStatus.error, message: 'The user is not allowed to access this team details.', code: 403 });
        }
    }
    
    return next();
}

exports.validateEnableTeamLink = async (req, res, next) => {
    const { id, is_link_sharing_enabled } = req.body;

    if (id) {
        if (!uuidValidate(id)) {
            return res.status(400).json({ status: httpStatus.error, message: 'The id is invalid.', code: 400 });
        }
    }

    if (typeof is_link_sharing_enabled !== "boolean") {
        return res.status(400).json({ status: httpStatus.error, message: 'The is_link_sharing_enabled field is required and must be a boolean.', code: 400 });
    }

    if (
        await Team.count({
            where: {
                id: id ? id : req.user.user.teamId
            }
        }) <= 0
    ) {
        return res.status(403).json({ status: httpStatus.error, message: 'The id is not valid.', code: 403 });
    }

    if (req.user.scope.indexOf('TEAM_LINK_UPDATE_ALL') === -1) {

        if (
            await TeamMember.count({
                where: {
                    teamId: id ? id : req.user.user.teamId,
                    userId: req.user.user.id,
                    access: {
                        [Op.contains]: ['TEAM_LINK_UPDATE_ASSIGNED']
                    }
                }
            }) <= 0
        ) {
            return res.status(403).json({ status: httpStatus.error, message: 'The user is not allowed to access this team details.', code: 403 });
        }
    }
    
    return next();
}

exports.validateInviteCodeParam = async (req, res, next) => {

    const { invite_code } = req.params;

    if (!invite_code) {
        return res.status(204).json( { status: httpStatus.success, message: 'There is no team to be joined', code: 204 } );
    }

    const team = await Team.findOne({
        where: {
            inviteCode: invite_code
        }
    });

    if (
        !team
    ) {
        return res.status(403).json({ status: httpStatus.error, message: 'The user is not allowed to join this team.', code: 403 });
    }

    if (
        !team.isLinkSharingEnabled
    ) {
        return res.status(400).json({ status: httpStatus.error, message: 'The team has turn off joining via link sharing.', code: 400 });
    }

    //don't allow temporary users to join the team
    if (
        await User.count({
            where: {
                id: {
                    [Op.eq]: req.user.user.id
                },
                isTemporary: {
                    [Op.eq]: true
                }
            }
        }) > 0
    ) {
        return res.status(400).json({ status: httpStatus.error, message: 'The user is not allowed to join any other team.', code: 400 });
    }

    const teamMember = await TeamMember.findOne({
        where: {
            teamId: team.id,
            userId: req.user.user.id
        }
    });

    if (
        teamMember
    ) {
        return res.status(400).json({ status: httpStatus.error, message: 'The user is already part of the team.', code: 400 });
    }
    
    return next();
}