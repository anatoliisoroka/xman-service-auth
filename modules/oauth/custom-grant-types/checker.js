const TeamTokenGrant = require('./TeamTokenGrant');
const UserRefreshTokenGrant = require('./UserRefreshTokenGrant');
const PasswordGrant = require('./PasswordGrant');

const { httpStatus } = require('../../../utilities/constants');
const RefreshTokenGrant = require('./RefreshTokenGrant');

module.exports = async (req, res, next) => {
    const { grant_type } = req.body;
    
    switch (grant_type) {
        case 'team_token':
            return TeamTokenGrant(req, res);
        case 'user_refresh_token':
            return UserRefreshTokenGrant(req, res);
        case 'refresh_token':
            return RefreshTokenGrant(req, res);
        case 'password':
        case null:
        case undefined:
        case '':
            return PasswordGrant(req, res);
        default:
            return res.status(400).json( { status: httpStatus.error, message: `The grant type is invalid.`, code: 400 } );
    }
}