//imports
//npm libraries
const { Op, Sequelize } = require('sequelize');

const { validate: uuidValidate } = require('uuid');

//local libraries
const { httpStatus } = require('../../../utilities/constants');
const { convertArrayScopeToBinary, convertToUniqueArray } = require('../../../utilities/converters')

const { generateAccessToken } = require('../../../utilities/tokens')

//model
const Team = require('../../../models/teams');
const RefreshToken = require('../../../models/refreshTokens');
const User = require('../../../models/users');
const TeamMember = require('../../../models/teamMembers');

module.exports = async (req, res) => {
    const { team_id, expiration, refresh_token } = req.body;

    if (!team_id) {
        return res.status(401).json({ status: httpStatus.error, message: 'The team_id field is required.', code: 401 });
    }

    if (!expiration) {
        return res.status(401).json({ status: httpStatus.error, message: 'The expiration field is required.', code: 401 });
    }

    if (!refresh_token) {
        return res.status(401).json({ status: httpStatus.error, message: 'The refresh_token field is required.', code: 401 });
    }

    if (isNaN(expiration)) {
        return res.status(401).json({ status: httpStatus.error, message: 'The expiration field must be a number', code: 401 });
    }


    if (Number(expiration) <= 0) {
        return res.status(401).json({ status: httpStatus.error, message: 'The expiration field must be a higher than 0', code: 401 });
    }

    if (!uuidValidate(team_id)) {
        return res.status(401).json({ status: httpStatus.error, message: 'The team_id field format is not valid.', code: 401 });
    }

    if (
        await Team.count( { where: { id: team_id } } ) <= 0
    ) {
        return res.status(401).json({ status: httpStatus.error, message: 'The team_id is not valid.', code: 401 });
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

    const admin = await User.findOne( 
        { 
            where: { 
                id: token.userId, 
                role: 0, 
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
        !admin
    ) {
        return res.status(401).json({ status: httpStatus.error, message: 'The refresh_token is not authorized to generate a new access token for the team.', code: 401 });
    }
    
    try {

        var exp = Math.floor((new Date().getTime() + (Number(expiration) * 60 * 1000)) / 1000);

        const scopes = convertToUniqueArray([admin.access || [], admin.team_members[0].access || []]);

        const token = generateAccessToken(
            { 
                id: admin.id, 
                username: admin.username,
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
    } catch (error) {
        return res.status(500).json( { status: httpStatus.error, message: `Encountered an error while creating access token for the team: ${error.message}`, code: 500 } );
    }
}