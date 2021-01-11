//imports
//npm libraries
const { Op, Sequelize } = require('sequelize');

const { validate: uuidValidate } = require('uuid');

//local libraries
const { httpStatus, getOauthConfig } = require('../../../utilities/constants');
const { convertArrayScopeToBinary, convertToUniqueArray } = require('../../../utilities/converters');

const { generateAccessToken } = require('../../../utilities/tokens')

//model
const RefreshToken = require('../../../models/refreshTokens');
const User = require('../../../models/users');
const TeamMember = require('../../../models/teamMembers');
const Team = require('../../../models/teams');

const refreshTokenFunc = new RefreshToken();

module.exports = async (req, res) => {
    const { team_id, expiration, refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(401).json({ status: httpStatus.error, message: 'The refresh_token field is required.', code: 401 });
    }

    if (!uuidValidate(refresh_token)) {
        return res.status(401).json({ status: httpStatus.error, message: 'The refresh_token field format is not valid.', code: 401 });
    }

    var userWhere = {};

    if (team_id) {
        if (!uuidValidate(team_id)) {
            return res.status(401).json({ status: httpStatus.error, message: 'The team_id field format is not valid.', code: 401 });
        }

        if (!expiration) {
            return res.status(401).json({ status: httpStatus.error, message: 'The expiration field is required.', code: 401 });
        }

        if (isNaN(expiration)) {
            return res.status(401).json({ status: httpStatus.error, message: 'The expiration field must be a number', code: 401 });
        }
    
        if (Number(expiration) <= 0) {
            return res.status(401).json({ status: httpStatus.error, message: 'The expiration field must be a higher than 0', code: 401 });
        }

        if (
            await Team.count( { where: { id: team_id } } ) <= 0
        ) {
            return res.status(401).json({ status: httpStatus.error, message: 'The team_id is not valid.', code: 401 });
        }

        //add where for checking if the token will be allowed to generate refresh token for the team
        userWhere.access = {
            [Op.contains]: ['TOKEN_CREATE']
        }
    }

    const token = await RefreshToken.findOne({ 
        where: { 
            token: {
                [Op.eq]: refresh_token
            }, 
            status: {
                [Op.eq]: 1
            },
            expiration: {
                [Op.or]: [
                    { [Op.gt]: Sequelize.fn('NOW') },
                    { [Op.eq]: null }
                ]
            } 
        } 
    });

    if (
        !token
    ) {
        return res.status(401).json({ status: httpStatus.error, message: 'The refresh_token is not valid.', code: 401 });
    }

    userWhere.id = {
        [Op.eq]: token.userId,
    }

    userWhere.status = {
        [Op.eq]: 1
    }

    const user = await User.findOne( 
        { 
            where: userWhere,
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
        }
    );

    if (
        !user
    ) {
        return res.status(401).json({ status: httpStatus.error, message: 'The refresh_token is not authorized to generate a new access token for the user/team.', code: 401 });
    }
    
    try {

        if (team_id) {
            //previous team token grant
            var exp = Math.floor((new Date().getTime() + (Number(expiration) * 60 * 1000)) / 1000);

            const scopes = convertToUniqueArray([user.access || [], user.team_members[0].access || []]);

            const token = generateAccessToken(
                { 
                    id: user.id, 
                    username: user.username,
                    teamId: team_id,
                },
                convertArrayScopeToBinary(scopes),
                exp
            );

            const accessToken = {
                accessToken: token,
                accessTokenExpiration: exp * 1000,
                tokenType: "Bearer"
            };

            return res.status(200).json(accessToken);
        }

        //proceed to a normal refresh token grant
        //from seconds
        var rfExp = Math.floor((new Date().getTime() + ((Number(getOauthConfig.refreshTokenLifetime)/60/60) * 60 * 60 * 1000)) / 1000);

        const rf = await RefreshToken.create({
            token: await refreshTokenFunc.generateToken(),
            expiration: new Date(rfExp * 1000),
            status: 1,
            userId: token.userId
        });    

        var exp = Math.floor((new Date().getTime() + ((Number(getOauthConfig.accessTokenLifetime)/60/60) * 60 * 60 * 1000)) / 1000);

        const scopes = convertToUniqueArray([user.access || [], user.team_members[0].access || []]);

        const tok = generateAccessToken(
            { 
                id: user.id, 
                username: user.username,
                teamId: user.team_members && user.team_members.length > 0 ? user.team_members[0].teamId : null,
            },
            convertArrayScopeToBinary(scopes),
            exp
        );

        const accessToken = {
            accessToken: tok,
            accessTokenExpiration: exp * 1000,
            refreshToken: rf.token,
            refreshTokenExpiration: new Date(rf.expiration).getTime(),
            tokenType: "Bearer"
        };

        return res.status(200).json(accessToken);
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while creating access token for the user: ${error.message}`, code: 500 } );
    }
}