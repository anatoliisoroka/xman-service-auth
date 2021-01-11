//imports
//npm libraries
const { Op } = require('sequelize');
const { validate: uuidValidate } = require('uuid');

//local libraries
const { httpStatus, getScopes, getScopeList } = require('../../utilities/constants');

//models
const User = require('../../models/users');
const RefreshToken = require('../../models/refreshTokens');

exports.validateUidPathParam = async (req, res, next) => {
    const { uid } = req.params;

    if (!uuidValidate(uid)) {
        return res.status(400).json({ status: httpStatus.error, message: 'The uid field is invalid.', code: 400 });
    }

    if (
        await User.count( { where: { id: uid } } ) <= 0
    ) {
        return res.status(400).json({ status: httpStatus.error, message: 'The uid is not valid.', code: 400 });
    }
    
    return next();
}

exports.validateUserIdBodyParam = async (req, res, next) => {
    const { user_id } = req.body;

    if (user_id) {
        if (!uuidValidate(user_id)) {
            return res.status(400).json({ status: httpStatus.error, message: 'The user_id field is invalid.', code: 400 });
        }

        if (
            await User.count( { where: { id: user_id } } ) <= 0
        ) {
            return res.status(400).json({ status: httpStatus.error, message: 'The user_id is not valid.', code: 400 });
        }
    }
    
    return next();
}

exports.validateExpiration = async (req, res, next) => {
    const { expiration } = req.body;

    if (expiration) {
        if (isNaN(expiration)) {
            return res.status(400).json({ status: httpStatus.error, message: 'The expiration field must be a number', code: 400 });
        }
    
        if (Number(expiration) <= 0) {
            return res.status(400).json({ status: httpStatus.error, message: 'The expiration field must be a higher than 0', code: 400 });
        }
    }
    
    return next();
}

exports.validateRevokeToken = async (req, res, next) => {
    const { uid } = req.params;
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(400).json({ status: httpStatus.error, message: 'The refresh_token field is required.', code: 400 });
    }

    if (!uuidValidate(refresh_token)) {
        return res.status(400).json({ status: httpStatus.error, message: 'The refresh_token field format is not valid.', code: 400 });
    }

    const token = await RefreshToken.findOne( { where: { token: refresh_token, status: 1, userId: uid } } );

    if (
        !token
    ) {
        return res.status(400).json({ status: httpStatus.error, message: 'The refresh_token is not valid.', code: 400 });
    }

    return next();
}