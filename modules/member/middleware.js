//imports
//npm libraries

const { validate: uuidValidate } = require('uuid');

//local libraries
const { httpStatus, getTeamSpecificScopeList, getMaxTeamMembers } = require('../../utilities/constants');

const { isValidEmailAddress, isValidContactNumber } = require('../../utilities/validator');
const { convertToFormattedNumber } = require('../../utilities/converters')

//model
var User = require('../../models/users');
const TeamMember = require('../../models/teamMembers');
const userFunc = new User();

exports.validateGetTeamMembers = async (req, res, next) => {

    const { team_id } = req.query;

    if (team_id) {
        if (!uuidValidate(team_id)) {
            return res.status(400).json({ status: httpStatus.error, message: 'The team_id is invalid.', code: 400 });
        }
    }

    var where = {
        teamId: team_id ? team_id : req.user.user.teamId
    }

    if (req.user.scope.indexOf('MEMBER_READ_ALL') === -1) {
        where.userId = req.user.user.id
    }

    if (
        await TeamMember.count({
            where: where
        }) <= 0 && req.user.scope.indexOf('MEMBER_READ_ALL') === -1
    ) {
        return res.status(403).json({ status: httpStatus.error, message: 'The user is not allowed to access this team details.', code: 403 });
    }
    
    return next();
}

exports.validateAddTeamMember = async (req, res, next) => {
    const { team_id, username, password, access, emailAddress, contactNumber, isSendCredentialsToEmail, isSendCredentialsToWa } = req.body;

    if (team_id) {
        if (!uuidValidate(team_id)) {
            return res.status(400).json({ status: httpStatus.error, message: 'The team_id is invalid.', code: 400 });
        }
    }

    if (!username) {
        return res.status(400).json({ status: httpStatus.error, message: 'The username field is required.', code: 400 });
    }

    if (!password) {
        return res.status(400).json({ status: httpStatus.error, message: 'The password field is required.', code: 400 });
    }

    if (!userFunc.isValidUserName(username)){
        return res.status(400).json({ status: httpStatus.error, message: 'The username format is not valid.', code: 400 });
    }

    if (!userFunc.isValidPassword(password)){
        return res.status(400).json({ status: httpStatus.error, message: 'The password format is not valid.', code: 400 });
    }

    if (!access) {
        return res.status(400).json({ status: httpStatus.error, message: 'The access field is required.', code: 400 });
    }

    if (!Array.isArray(access)) {
        return res.status(400).json({ status: httpStatus.error, message: 'The access field must be an array.', code: 400 });
    }

    if (access.length <= 0) {
        return res.status(400).json({ status: httpStatus.error, message: 'The access field must have atleast one value.', code: 400 });
    }

    if(!access.every( a => getTeamSpecificScopeList.indexOf(a) >= 0)) {
        return res.status(400).json({ status: httpStatus.error, message: 'The access field has an invalid value.', code: 400 });
    }

    if (emailAddress && !isValidEmailAddress(emailAddress)) {
        return res.status(400).json({ status: httpStatus.error, message: 'The emailAddress field is not valid.', code: 400 });
    }

    if (contactNumber && !isValidContactNumber(convertToFormattedNumber(contactNumber))) {
        return res.status(400).json({ status: httpStatus.error, message: 'The contactNumber format is not valid.', code: 400 });
    }

    if (isSendCredentialsToEmail && typeof isSendCredentialsToEmail !== "boolean") {
        return res.status(400).json({ status: httpStatus.error, message: 'The isSendCredentialsToEmail field is not boolean.', code: 400 });
    }

    if (isSendCredentialsToWa && typeof isSendCredentialsToWa !== "boolean") {
        return res.status(400).json({ status: httpStatus.error, message: 'The isSendCredentialsToWa field is not boolean.', code: 400 });
    }

    var where = {
        teamId: team_id ? team_id : req.user.user.teamId
    }

    if (req.user.scope.indexOf('MEMBER_CREATE_ALL') === -1) {
        where.userId = req.user.user.id
    }

    const team = await TeamMember.findOne({
        where: where
    })

    if (
        !team
    ) {
        return res.status(403).json({ status: httpStatus.error, message: 'The user is not allowed to access this team details.', code: 403 });
    }

    //check if the members already exceeded it's limit

    if (
        await TeamMember.count(
            {
                where: {
                    teamId: team_id ? team_id : req.user.user.teamId
                }
            }
        ) >= getMaxTeamMembers
    ) {
        return res.status(403).json({ status: httpStatus.error, message: `The user is not allowed to create another member. The team reached the member limit.`, code: 403 });
    }

    //allow only admin and team admin to add a member
    if (req.user.scope.indexOf('MEMBER_CREATE_ALL') === -1 && (Array.isArray(team.access) && team.access || []).indexOf('MEMBER_CREATE_ASSIGNED') === -1) {
        return res.status(401).json({ status: httpStatus.error, message: 'The role is not authorized to process the request.', code: 401 });
    }

    if (
        await userFunc.isUserNameExists(username).then(
            result => {
                return result;
            }
        ).catch(
            error => {
                return false;
            }
        )
    ) {
        return res.status(400).json({ status: httpStatus.error, message: 'The username is already taken.', code: 400 });
    }

    return next();
}

exports.validateUpdateTeamMember = async (req, res, next) => {
    const { team_id, user_id, access } = req.body;

    if (team_id) {
        if (!uuidValidate(team_id)) {
            return res.status(400).json({ status: httpStatus.error, message: 'The team_id is invalid.', code: 400 });
        }
    }

    var where = {
        teamId: team_id ? team_id : req.user.user.teamId
    }

    if (req.user.scope.indexOf('MEMBER_UPDATE_ALL') === -1) {
        where.userId = req.user.user.id
    }

    const team = await TeamMember.findOne({
        where: where
    })

    if (
        !team  && req.user.scope.indexOf('MEMBER_READ_ALL') === -1
    ) {
        return res.status(403).json({ status: httpStatus.error, message: 'The user is not allowed to access this team details.', code: 403 });
    }

    //allow only admin and team admin to add a member
    if (req.user.scope.indexOf('MEMBER_UPDATE_ALL') === -1 && (Array.isArray(team.access) && team.access || []).indexOf('MEMBER_UPDATE_ASSIGNED') === -1) {
        return res.status(401).json({ status: httpStatus.error, message: 'The role is not authorized to process the request.', code: 401 });
    }

    if (!user_id) {
        return res.status(400).json({ status: httpStatus.error, message: 'The user_id field is required.', code: 400 });
    }

    if (!uuidValidate(user_id)) {
        return res.status(400).json({ status: httpStatus.error, message: 'The user id is invalid.', code: 400 });
    }

    if (
        await User.count({
            where: {
                id: user_id
            }
        }) <= 0
    ) {
        return res.status(400).json({ status: httpStatus.error, message: 'The user id is not valid.', code: 400 });
    }

    if (!access) {
        return res.status(400).json({ status: httpStatus.error, message: 'The access field is required.', code: 400 });
    }

    if (!Array.isArray(access)) {
        return res.status(400).json({ status: httpStatus.error, message: 'The access field must be an array.', code: 400 });
    }

    if (access.length <= 0) {
        return res.status(400).json({ status: httpStatus.error, message: 'The access field must have atleast one value.', code: 400 });
    }

    if(!access.every( a => getTeamSpecificScopeList.indexOf(a) >= 0)) {
        return res.status(400).json({ status: httpStatus.error, message: 'The access field has an invalid value.', code: 400 });
    }

    return next();
}

exports.validateDeleteTeamMember = async (req, res, next) => {
    const { team_id, user_id } = req.query;

    if (team_id) {
        if (!uuidValidate(team_id)) {
            return res.status(400).json({ status: httpStatus.error, message: 'The team_id is invalid.', code: 400 });
        }
    }

    var where = {
        teamId: team_id ? team_id : req.user.user.teamId
    }

    //allow only admin and team admin to add a member
    if (req.user.scope.indexOf('MEMBER_DELETE_ALL') === -1 && (Array.isArray(team.access) && team.access || []).indexOf('MEMBER_DELETE_ASSIGNED') === -1) {
        return res.status(401).json({ status: httpStatus.error, message: 'The role is not authorized to process the request.', code: 401 });
    }

    const team = await TeamMember.findOne({
        where: where
    })

    if (
        !team
    ) {
        return res.status(403).json({ status: httpStatus.error, message: 'The user is not allowed to access this team details.', code: 403 });
    }

    //allow only admin and team admin to add a member
    if (req.user.scope.indexOf('MEMBER_CREATE_ALL') === -1 && team.role != 0) {
        return res.status(401).json({ status: httpStatus.error, message: 'The role is not authorized to process the request.', code: 401 });
    }

    if (!user_id) {
        return res.status(400).json({ status: httpStatus.error, message: 'The user_id field is required.', code: 400 });
    }

    if (!uuidValidate(user_id)) {
        return res.status(400).json({ status: httpStatus.error, message: 'The user id is invalid.', code: 400 });
    }

    if (
        await TeamMember.count({
            where: {
                userId: user_id,
                teamId: team.teamId
            }
        }) <= 0
    ) {
        return res.status(400).json({ status: httpStatus.error, message: 'The user id is not valid.', code: 400 });
    }

    return next();
}