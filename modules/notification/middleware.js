//imports
//npm libraries
const { Op } = require('sequelize');

const { validate: uuidValidate } = require('uuid');

//local libraries
const { httpStatus } = require('../../utilities/constants');

//models
const Team = require('../../models/teams');
const User = require('../../models/users');
const TeamMember = require('../../models/teamMembers');

exports.validatePostNotification = async (req, res, next) => {
    const { title, content } = req.body;
    const { userId } = req.query;

    if (!title) {
        return res.status(400).json({ status: httpStatus.error, message: 'The title field is required.', code: 400 });
    }

    if (!content) {
        return res.status(400).json({ status: httpStatus.error, message: 'The content field is required.', code: 400 });
    }

    if (typeof title !== 'string') {
        return res.status(400).json({ status: httpStatus.error, message: 'The title field should be a string.', code: 400 });
    }

    if (typeof content !== 'string') {
        return res.status(400).json({ status: httpStatus.error, message: 'The content field should be a string.', code: 400 });
    }

    if (title.length <= 0 && title.length > 128) {
        return res.status(400).json({ status: httpStatus.error, message: 'The title field should only have minimum of 1 character and maximum of 128 characters.', code: 400 });
    }

    if (content.length <= 0 && content.length > 1024) {
        return res.status(400).json({ status: httpStatus.error, message: 'The content field should only have minimum of 1 character and maximum of 1024 characters.', code: 400 });
    }

    if (req.user.user.teamId && !uuidValidate(req.user.user.teamId)) {
        return res.status(401).json({ status: httpStatus.error, message: 'The team id is not valid.', code: 401 });
    }

    if (userId && !uuidValidate(userId)) {
        return res.status(401).json({ status: httpStatus.error, message: 'The userId is not valid.', code: 401 });
    }

    const team = await Team.findOne({
        where: {
            id: {
                [Op.eq]: req.user.user.teamId
            }
        }
    });

    if (!team.isNotifyEmail && !team.isNotifyWa) {
        return res.status(204).json({ status: httpStatus.success, message: 'The team is not available for notification.', code: 204 });
    }

    req.body.isNotifyEmail = team.isNotifyEmail;
    req.body.isNotifyWa = team.isNotifyWa;

    if (userId) {
        // use the email
        const user = await User.findOne({
            where: {
                id: {
                    [Op.eq]: userId
                }
            }
        })

        if (!user) {
            return res.status(204).json({ status: httpStatus.success, message: 'The team is not available for notification since the user is not found on the database', code: 204 });
        }

        // use the email address of the admin or the first member of the team
        const membership = await TeamMember.findOne(
            {
              where: {
                  teamId: {
                      [Op.eq]: req.user.user.teamId
                  },
                  userId: {
                      [Op.eq]: userId
                  }
              },
              order: [['created', 'ASC']]
            }
        )
        
        //return if no membership found
        if (!membership) {
            return res.status(204).json({ status: httpStatus.success, message: 'The team is not available for notification since the user doesn\'t belong to the team.', code: 204 });
        }

        req.body.emailAddress = user.emailAddress;
        req.body.contactNumber = user.contactNumber;

    }

    if (!req.body.emailAddress && !req.body.contactNumber) {
        // use the email address of the admin or the first member of the team
        const member = await TeamMember.findOne(
            {
              where: {
                  teamId: {
                      [Op.eq]: req.user.user.teamId
                  }
              },
              order: [['created', 'ASC']]
            }
        )

        //return if no member found
        if (!member) {
            return res.status(204).json({ status: httpStatus.success, message: 'The team is not available for notification since it doesn\`t have any member.', code: 204 });
        }
        
        const userMember = await User.findOne({
            where: {
                id: {
                    [Op.eq]: member.userId
                }
            }
        })

        if (!userMember.emailAddress && !userMember.contactNumber) {
            return res.status(204).json({ status: httpStatus.success, message: 'The team is not available for notification since the admin doesn\`t have any email or wa number setup.', code: 204 });
        }

        req.body.emailAddress = userMember.emailAddress;
        req.body.contactNumber = userMember.contactNumber;
    }
    
    return next();
}