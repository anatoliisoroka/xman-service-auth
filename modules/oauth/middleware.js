//imports
//npm libraries
//for jwt
const jwt = require('jsonwebtoken');

const { validate: uuidValidate } = require('uuid');

//local libraries
const { httpStatus, publicKey } = require('../../utilities/constants');

//converters 
const { convertBinaryScopeToArray } = require('../../utilities/converters');

//model
const RefreshToken = require('../../models/refreshTokens');

exports.authenticate = (options) => {
    var options = options || {};

    return (req, res, next) => {
        const accessToken = req.headers.authorization;
        if (!accessToken) {
            return res.status(401).json( { status: httpStatus.error, message: "The access token is invalid.", code: 401 } );
        }

        const tokenSplit = accessToken.split(' ');

        if (tokenSplit.length !== 2) {
            return res.status(401).json( { status: httpStatus.error, message: "The access token is malformatted.", code: 401 } );
        }

        try {

            const data = jwt.verify(tokenSplit[1], publicKey);

            if (!data) {
                return res.status(401).json( { status: httpStatus.error, message: "The access token is not valid.", code: 401 } );
            }

            //check if the access token is expired
            if (new Date().getTime() > data.exp * 1000) {
                return res.status(401).json( { status: httpStatus.error, message: "The access token is already expired.", code: 401 } );
            }

            //check scope
            if (options.scope) {
                const scopes = `${options.scope}`.trim().split(',').filter(s => convertBinaryScopeToArray(data.scope).indexOf(s) >= 0);

                if (scopes.length <= 0) {
                    return res.status(403).json( { status: httpStatus.error, message: "The authorized scopes is insufficient.", code: 403 } );
                }
            }
            
            data.scope = convertBinaryScopeToArray(data.scope);

            //save to req.user
            req.user = data;
            return next();
        } catch (error) {
            console.log(error);
            if (error instanceof jwt.TokenExpiredError) {
                return res.status(401).json( { status: httpStatus.error, message: "The access token is already expired.", code: 401 } );
            }

            if (error instanceof TypeError) {
                return res.status(401).json( { status: httpStatus.error, message: "The access token is malformatted.", code: 401 } );
            }

            if (error instanceof jwt.JsonWebTokenError) {
                return res.status(401).json( { status: httpStatus.error, message: "The access token is not a jwt token.", code: 401 } );
            }

            return res.status(401).json( { status: httpStatus.error, message: "The access token is invalid and cannot be verified.", code: 401 } );
        }

    }
}

exports.validateRevokeToken = async (req, res, next) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(401).json({ status: httpStatus.error, message: 'The refresh_token field is required.', code: 401 });
    }

    if (!uuidValidate(refresh_token)) {
        return res.status(401).json({ status: httpStatus.error, message: 'The refresh_token field format is not valid.', code: 401 });
    }

    const token = await RefreshToken.findOne( { where: { token: refresh_token } } );
    if (
        !token
    ) {
        return res.status(401).json({ status: httpStatus.error, message: 'The refresh_token is not valid.', code: 401 });
    }

    return next();
}