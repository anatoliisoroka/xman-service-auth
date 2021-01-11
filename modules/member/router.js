//imports
//npm libraries
const express = require('express');

//local libraries
//authenticate middleware
const { authenticate } = require('../oauth/middleware');

//controller
const controller = require('./controller');
const middleware = require('./middleware');

//initialize router
const router = express.Router();

//parsers
const jsonParser = express.json();
const urlEncodedParser = express.urlencoded( { extended: true} );

//url encoded converter
const { convertJsonToUrlEncoded } = require('../../utilities/converters');

router.get(
    '/',
    authenticate( { scope: 'MEMBER_READ_ASSIGNED,MEMBER_READ_ALL' } ),
    middleware.validateGetTeamMembers,
    controller.getTeamMembers
);

router.post(
    '/',
    authenticate( { scope: 'MEMBER_CREATE_ASSIGNED,MEMBER_CREATE_ALL' } ),
    jsonParser,
    convertJsonToUrlEncoded,
    urlEncodedParser,
    middleware.validateAddTeamMember,
    controller.addTeamMember
);

router.patch(
    '/',
    authenticate( { scope: 'MEMBER_UPDATE_ASSIGNED,MEMBER_UPDATE_ALL' } ),
    jsonParser,
    convertJsonToUrlEncoded,
    urlEncodedParser,
    middleware.validateUpdateTeamMember,
    controller.updateTeamMember
);

router.delete(
    '/',
    authenticate( { scope: 'MEMBER_DELETE_ASSIGNED,MEMBER_DELETE_ALL' } ),
    middleware.validateDeleteTeamMember,
    controller.deleteTeamMember
);

module.exports = router;