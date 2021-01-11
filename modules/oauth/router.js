//imports
//npm libraries
const express = require('express');

//local libraries

//controller
const oauthController = require('./controller');
const { validateRevokeToken, authenticate } = require('./middleware');

//initialize router
const router = express.Router();

//parsers
const urlEncodedParser = express.urlencoded( { extended: true} );
const jsonParser = express.json();

//url encoded converter
const { convertJsonToUrlEncoded } = require('../../utilities/converters');

//custom grant checker
const grantChecker = require('./custom-grant-types/checker');

router.post(
    '/token', 
    jsonParser,
    convertJsonToUrlEncoded,
    urlEncodedParser,
    grantChecker
);

router.post(
    '/revoke',
    jsonParser,
    convertJsonToUrlEncoded,
    urlEncodedParser,
    validateRevokeToken,
    oauthController.revoke
);

router.delete(
    '/revoke/all',
    authenticate( { scope: 'TOKEN_DELETE_ASSIGNED,TOKEN_DELETE_ALL' } ),
    oauthController.revokeAll
);

module.exports = router;