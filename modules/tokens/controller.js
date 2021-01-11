//imports
//npm libraries
const { Op } = require('sequelize');

const { validate: uuidValidate } = require('uuid');

//local libraries
const { httpStatus, getOauthConfig } = require('../../utilities/constants');

//models
const RefreshToken = require('../../models/refreshTokens');
const User = require('../../models/users');

/**
 * @param {int} limit
 * max count of the returned rows
 * @param {int} offset
 * where to start the count
 * @param {boolean} all 
 * for admin use only. Will allow the admin to fetch all user refresh token
 * @param {string} user_id
 * for admin use only. Will allow the admin to fetch all refresh token for a specific user
 * @param {string} id
 * filter for refresh token id
 * @param {string} refresh_token
 * filter for refresh token value
 */
exports.getUserTokens = async (req, res) => {
    const { limit, offset, all, user_id, id, token } = req.query;

    try {
        var where = {};
        //query for the admin
        if(req.user.scope.indexOf('TOKEN_READ_ALL') >= 0 ) {
            if (all === 'true') {

                if (user_id) {
                    if(!uuidValidate(user_id)) {
                        return res.status(400).json( { status: httpStatus.error, message: 'The user_id is invalid', code: 400 } );
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

        if (id) {
            if(!uuidValidate(id)) {
                return res.status(400).json( { status: httpStatus.error, message: 'The id is invalid', code: 400 } );
            } else {
                where.id = {
                    [Op.eq]: id
                }
            }
        }

        if (token) {
            if(!uuidValidate(token)) {
                return res.status(400).json( { status: httpStatus.error, message: 'The token is invalid', code: 400 } );
            } else {
                where.token = {
                    [Op.eq]: token
                }
            }
        }

        const refreshTokens = await RefreshToken.findAll({
            where: where,
            order: [
                ['created', 'ASC']
            ],
            limit: limit,
            offset: offset
        });


        return res.status(200).json( { status: httpStatus.success, message: 'Successfully fetched the user tokens', code: 200, meta: refreshTokens } );
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while fetching the tokens: ${error.message}`, code: 500 } );
    }

}

/**
 * @param {string} user_id
 * Will allow to create a token for specific user or if not existing will be creating for the admin account
 * @param {string} scope
 * comma-separated scope for the token
 * @param {number} expiration
 * a nullable field to set the expiration of the token
 */
exports.createRefreshToken = async (req, res) => {
    const { expiration, user_id } = req.body;

    try {

        //set expiration for refresh tokens
        var exp;
        if (!expiration) {
            exp = expiration;
        } else {
            if (expiration) {
                exp = new Date(Math.floor(new Date().getTime() + (Number(expiration) * 60 * 1000)));
            } else {
                exp = new Date();
                exp.setDate(exp.getDate() + ((getOauthConfig.refreshTokenLifetime/60/60/24)));
            }
        }

        const refreshToken = await RefreshToken.create({
            expiration: exp,
            status: 1,
            userId: user_id ? user_id : req.user.user.id
        });

        return res.status(200).json( { status: httpStatus.success, message: 'Successfully created the user token', code: 200, meta: refreshToken } );
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while creating the user token: ${error.message}`, code: 500 } );
    }

}