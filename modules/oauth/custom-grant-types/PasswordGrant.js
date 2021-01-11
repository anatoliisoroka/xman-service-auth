//imports
//npm libraries
const { Op } = require('sequelize');

//local libraries
const { httpStatus, getOauthConfig } = require('../../../utilities/constants');

const { convertArrayScopeToBinary, convertToUniqueArray } = require('../../../utilities/converters');

const { generateAccessToken } = require('../../../utilities/tokens')

//model
const RefreshToken = require('../../../models/refreshTokens');
const refreshTokenFunc = new RefreshToken();
const User = require('../../../models/users');
const userFunc = new User();
const TeamMember = require('../../../models/teamMembers');

module.exports = async (req, res) => {
    //get username and password from the request
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(401).json({ status: httpStatus.error, message: 'The username and password is required.', code: 401 });
    }

    if (!userFunc.isValidUserName(username)){
        return res.status(401).json({ status: httpStatus.error, message: 'The username format is not valid.', code: 401 });
    }

    //TODO: remove if all users updated their password
    // if (!userFunc.isValidPassword(password)){
    //     return res.status(401).json({ status: httpStatus.error, message: 'The password format is not valid.', code: 401 });
    // }

    //check if the username is existing
    const user = await User.findOne({
        where: {
            username: {
                [Op.eq]: username
            },
            status: {
                [Op.ne]: 3 //deleted
            }
        },
        include: 
        {
            model: TeamMember,
            attributes: [
                'teamId',
                'role',
                'access'
            ],
            where: {
                isDefault: {
                    [Op.eq]: true
                }
            },
            limit: 1,
        },
    });

    //check whether the user is existing or not
    if (!user) {
        return res.status(401).json({ status: httpStatus.error, message: 'The user is not available for login.', code: 401 });
    }

    //we can remove this if we want to validate all in the oauth server
    //check if the status is deactivated
    if (user.status == 0) {
        return res.status(401).json({ status: httpStatus.error, message: 'The user needs to be activated before login.', code: 401 });
    }
    //check if the status is blocked
    else if (user.status == 2) {
        return res.status(401).json({ status: httpStatus.error, message: 'The user is not authorized to login.', code: 401 })
    }

    //compare password
    if (!await userFunc.comparePasswordHash(password, user.password)) {
        if (!await userFunc.comparePasswordHash(user.salt + password, user.password)) {
            return res.status(401).json({ status: httpStatus.error, message: 'The username and password is not valid.', code: 401 })
        }
    }

    if (!user.team_members || user.team_members.length <= 0) {
        return res.status(401).json({ status: httpStatus.error, message: 'The account cannot be logged in. Please contact support.', code: 401 })
    }

    //generate the token
    try {
        //from seconds
        var rfExp = Math.floor((new Date().getTime() + ((Number(getOauthConfig.refreshTokenLifetime)/60/60) * 60 * 60 * 1000)) / 1000);

        const rf = await RefreshToken.create({
            token: await refreshTokenFunc.generateToken(),
            expiration: new Date(rfExp * 1000),
            status: 1,
            userId: user.id
        });    

        var exp = Math.floor((new Date().getTime() + ((Number(getOauthConfig.accessTokenLifetime)/60/60) * 60 * 60 * 1000)) / 1000);

        const scopes = convertToUniqueArray([user.access || [], user.team_members[0].access || []]);

        const tok = generateAccessToken(
            { 
                id: user.id, 
                username: user.username,
                teamId: user.team_members[0].teamId,
            },
            convertArrayScopeToBinary(scopes),
            exp
        )

        const token = {
            accessToken: tok,
            accessTokenExpiration: exp * 1000,
            refreshToken: rf.token,
            refreshTokenExpiration: new Date(rf.expiration).getTime(),
            tokenType: "Bearer"
        };

        return res.status(200).json(token);
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while creating access token for the user: ${error.message}`, code: 500 } );
    }
}