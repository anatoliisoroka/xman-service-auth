//imports
//npm libraries
const jwt = require('jsonwebtoken');

//local libraries
const { privateKey, getOauthAlgorithm } = require('./constants');


exports.generateAccessToken = (user, scope, exp) => {
    return jwt.sign(
        {
            user, 
            scope, 
            exp 
        }, 
        privateKey, 
        { 
            algorithm: getOauthAlgorithm
        }
    );
}