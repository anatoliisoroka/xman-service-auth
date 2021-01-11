//imports
//npm libraries
const { Op } = require('sequelize');

const { validate: uuidValidate } = require('uuid');

//local libraries
const { httpStatus } = require('../../utilities/constants');

//models
const RefreshToken = require('../../models/refreshTokens');

exports.revoke = async (req, res) => {
    const { refresh_token } = req.body;
    try {

        await RefreshToken.destroy({
            where: {
                token: {
                    [Op.eq]: refresh_token
                }
            },
            force: true
        });

        return res.status(200).json( { status: httpStatus.success, message: 'Successfully revoked the refresh token', code: 200 } );
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: error.message, code: 500 } );
    }
}

/**
 * @param {string} user_id
 * For admin use only. The target user_id to be revoked or can have a value of 'all' in where will delete all refresh tokens
 */
exports.revokeAll = async (req, res) => {
    const { user_id } = req.query;
    try {
        var where = {}
        if (req.user.scope.indexOf('TOKEN_DELETE_ALL') >= 0) {
            if (user_id) {
                if (user_id.toLowerCase() === 'all') {
                    
                } else {
                    if (!uuidValidate(user_id)) {
                        return res.status(400).json( { status: httpStatus.error, message: 'The user_id is invalid.', code: 400 } );
                    } else {
                        where.userId = {
                            [Op.eq]: user_id
                        }
                    }
                }
            } else {
                where.userId = {
                    [Op.eq]: req.user.user.id
                };
            }
        } else {
            where.userId = {
                [Op.eq]: req.user.user.id
            };
        }

        await RefreshToken.destroy({
            where: where,
            force: true
        });

        return res.status(200).json( { status: httpStatus.success, message: 'Successfully revoked all refresh tokens', code: 200 } );
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: error.message, code: 500 } );
    }
}