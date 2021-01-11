//imports
//npm libraries
const { validate: uuidValidate } = require('uuid');

//local libraries
const { httpStatus, getStatus, getScopeList } = require('../../utilities/constants');

const { isValidEmailAddress, isValidContactNumber } = require('../../utilities/validator');

const { convertToFormattedNumber } = require('../../utilities/converters')

//models
const User = require('../../models/users');
const userFunc = new User();

exports.validateUserCreation = async (req, res, next) => {
    //create user
    const { username, password, status, emailAddress, access, contactNumber, isSendCredentialsToEmail, isSendCredentialsToWa } = req.body;

    if (!username) {
        return res.status(400).json({ status: httpStatus.error, message: 'The username field is required.', code: 400 });
    }

    if (!password) {
        return res.status(400).json({ status: httpStatus.error, message: 'The password field is required.', code: 400 });
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

    if(!access.every( a => getScopeList.indexOf(a) >= 0)) {
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

    if (!userFunc.isValidUserName(username)){
        return res.status(400).json({ status: httpStatus.error, message: 'The username format is not valid.', code: 400 });
    }

    if (!userFunc.isValidPassword(password)){
        return res.status(400).json({ status: httpStatus.error, message: 'The password format is not valid.', code: 400 });
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

    if (status) {
        if (typeof status !== "string") {
            return res.status(400).json({ status: httpStatus.error, message: 'The status field must be a string.', code: 400 });
        }

        if (getStatus.indexOf(status.toLowerCase()) == -1) {
            return res.status(400).json({ status: httpStatus.error, message: 'The status field is not valid.', code: 400 });
        }
    }

    return next();
}

exports.validateUserModification = async (req, res, next) => {
    //update user
    const { id, username, password, status, access, emailAddress, contactNumber } = req.body;

    if (!username) {
        return res.status(400).json({ status: httpStatus.error, message: 'The username field is required.', code: 400 });
    }

    if (!userFunc.isValidUserName(username)){
        return res.status(400).json({ status: httpStatus.error, message: 'The username format is not valid.', code: 400 });
    }

    if (password) {
        if (!userFunc.isValidPassword(password)){
            return res.status(400).json({ status: httpStatus.error, message: 'The password format is not valid.', code: 400 });
        }
    }

    if (emailAddress && !isValidEmailAddress(emailAddress)) {
        return res.status(400).json({ status: httpStatus.error, message: 'The emailAddress format is not valid.', code: 400 });
    }

    if (contactNumber && !isValidContactNumber(convertToFormattedNumber(contactNumber))) {
        return res.status(400).json({ status: httpStatus.error, message: 'The contactNumber format is not valid.', code: 400 });
    }

    if (req.user.scope.indexOf('USER_UPDATE_ALL') >= 0) {
        if (id) {
            if (!uuidValidate(id)) {
                return res.status(400).json({ status: httpStatus.error, message: 'The id format is not valid.', code: 400 });
            }
        }

        if (access) {
            if (!Array.isArray(access)) {
                return res.status(400).json({ status: httpStatus.error, message: 'The access field must be an array.', code: 400 });
            }
        
            if (access.length <= 0) {
                return res.status(400).json({ status: httpStatus.error, message: 'The access field must have atleast one value.', code: 400 });
            }

            if(!access.every( a => getScopeList.indexOf(a) >= 0)) {
                return res.status(400).json({ status: httpStatus.error, message: 'The access field has an invalid value.', code: 400 });
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
    }

    if (
        await User.count( { where: { id: id && req.user.scope.indexOf('USER_UPDATE_ALL') >= 0 ? id : req.user.user.id } } ) <= 0
    ) {
        return res.status(400).json({ status: httpStatus.error, message: 'The id is not valid.', code: 400 });
    }

    if (
        await userFunc.isUserNameExistsExceptForId(id && req.user.scope.indexOf('USER_UPDATE_ALL') >= 0 ? id : req.user.user.id, username).then(
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

exports.validateUserDelete = async (req, res, next) => {
    const { id } = req.query;

    if(!id) {
        return res.status(400).json({ status: httpStatus.error, message: 'The id field is required.', code: 400 });
    }

    if (!uuidValidate(id)) {
        return res.status(400).json({ status: httpStatus.error, message: 'The id field is invalid.', code: 400 });
    }

    if (
        await User.count( { where: { id: id } } ) <= 0
    ) {
        return res.status(400).json({ status: httpStatus.error, message: 'The id field is not valid.', code: 400 });
    }
    
    return next();
}