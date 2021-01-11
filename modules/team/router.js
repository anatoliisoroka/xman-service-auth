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
    authenticate(),
    controller.getTeams
);

router.post(
    '/',
    authenticate( { scope: 'TEAM_CREATE' } ),
    jsonParser,
    convertJsonToUrlEncoded,
    urlEncodedParser,
    middleware.validateTeamCreation,
    controller.createTeam
);

router.patch(
    '/',
    authenticate({ scope: 'TEAM_UPDATE_ASSIGNED,TEAM_UPDATE_ALL' }),
    jsonParser,
    convertJsonToUrlEncoded,
    urlEncodedParser,
    middleware.validateTeamModification,
    controller.modifyTeam
);

router.delete(
    '/',
    authenticate( { scope: 'TEAM_DELETE' } ),
    middleware.validateTeamDelete,
    controller.deleteTeam
);

router.post(
    '/switch',
    authenticate( { scope: 'TEAM_SWITCH_ASSIGNED,TEAM_SWITCH_ALL' } ),
    jsonParser,
    convertJsonToUrlEncoded,
    urlEncodedParser,
    middleware.validateTeamSwitch,
    controller.switchTeam
);

router.get(
    '/link',
    authenticate( { scope: 'TEAM_LINK_READ_ALL,TEAM_LINK_READ_ASSIGNED' } ),
    middleware.validateTeamLink,
    controller.fetchInviteLink
);

router.post(
    '/link',
    authenticate( { scope: 'TEAM_LINK_UPDATE_ASSIGNED,TEAM_LINK_UPDATE_ALL' } ),
    middleware.validateTeamNewLink,
    controller.fetchNewInviteLink
);

router.post(
    '/link/enable',
    authenticate( { scope: 'TEAM_LINK_UPDATE_ASSIGNED,TEAM_LINK_UPDATE_ALL' } ),
    jsonParser,
    convertJsonToUrlEncoded,
    urlEncodedParser,
    middleware.validateEnableTeamLink,
    controller.enableLinkSharing
);

router.post(
    '/join/:invite_code',
    authenticate( { scope: 'TEAM_LINK_JOIN' } ),
    middleware.validateInviteCodeParam,
    controller.joinTeamViaInviteCode
);

router.get(
    '/filters',
    authenticate(),
    controller.getTeamsViaFilter
);

module.exports = router;