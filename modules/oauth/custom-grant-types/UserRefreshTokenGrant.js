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

const refreshTokenFunc = new RefreshToken();

module.exports = async (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(401).json({ status: httpStatus.error, message: 'The refresh_token field is required.', code: 401 });
    }

    if (!uuidValidate(refresh_token)) {
        return res.status(401).json({ status: httpStatus.error, message: 'The refresh_token field format is not valid.', code: 401 });
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

    const user = await User.findOne( 
        { 
            where: 
            { 
                id: token.userId, 
                status: 1 
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
        }
    );

    if (
        !user
    ) {
        return res.status(401).json({ status: httpStatus.error, message: 'The refresh_token is not authorized to generate a new access token for the user.', code: 401 });
    }
    
    try {
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
        )

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