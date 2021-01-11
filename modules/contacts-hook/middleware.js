//imports
//npm libraries
const { Op } = require('sequelize');

const { validate: uuidValidate } = require('uuid');

//local libraries
const { httpStatus, getContactsEvent } = require('../../utilities/constants');

//models
const Team = require('../../models/teams');
const User = require('../../models/users');
const TeamMember = require('../../models/teamMembers');

exports.validatePostNotification = async (req, res, next) => {
    //event: open|close
    const { event, data } = req.body;

    if (!event) {
        return res.status(400).json({ status: httpStatus.error, message: 'The event field is required.', code: 400 });
    }

    if (!data) {
        return res.status(400).json({ status: httpStatus.error, message: 'The data field is required.', code: 400 });
    }

    if (typeof event !== 'string') {
        return res.status(400).json({ status: httpStatus.error, message: 'The event field should be a string.', code: 400 });
    }

    if (typeof data !== 'object') {
        return res.status(400).json({ status: httpStatus.error, message: 'The data field should be an object.', code: 400 });
    }

    if (getContactsEvent.indexOf(event.toLowerCase()) === -1) {
        return res.status(400).json({ status: httpStatus.error, message: 'The event field is not valid.', code: 400 });
    }

    if (!data.assignee || data.assignee === "" || !uuidValidate(data.assignee)) {
        return res.status(204).json({ status: httpStatus.success, message: `The assignee field doesn't have a value or has an invalid value.`, code: 204 });
    }

    if (!Array.isArray(data.phoneNumbers) || data.phoneNumbers.length <= 0) {
        return res.status(204).json({ status: httpStatus.success, message: `The phoneNumbers field doesn't have a value or has an invalid value.`, code: 204 });
    }

    if (req.user.user.id === data.assignee) {
        return res.status(204).json({ status: httpStatus.success, message: `The assignee is the same as the person who requested the hook.`, code: 204 });
    }

    if (req.user.user.teamId && !uuidValidate(req.user.user.teamId)) {
        return res.status(401).json({ status: httpStatus.error, message: 'The team id is not valid.', code: 401 });
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

    const membership = await TeamMember.findOne(
        {
          where: {
              teamId: {
                  [Op.eq]: req.user.user.teamId
              },
              userId: {
                  [Op.eq]: data.assignee
              }
          },
          order: [['created', 'ASC']]
        }
    )
        
    //return if no membership found
    if (!membership) {
        return res.status(204).json({ status: httpStatus.success, message: 'The assignee is not available for notification since the user doesn\'t belong to the team.', code: 204 });
    }
        
    const userMember = await User.findOne({
        where: {
            id: {
                [Op.eq]: membership.userId
            }
        }
    })

    if (!userMember.emailAddress && !userMember.contactNumber) {
        return res.status(204).json({ status: httpStatus.success, message: 'The assignee is not available for notification since the admin doesn\`t have any email or wa number setup.', code: 204 });
    }

    req.body.emailAddress = userMember.emailAddress;
    req.body.contactNumber = userMember.contactNumber;

    return next();
}