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
    controller.getUserTokens
);

router.post(
    '/', 
    jsonParser,
    convertJsonToUrlEncoded,
    urlEncodedParser,
    authenticate( { scope: 'TOKEN_CREATE' } ),
    middleware.validateUserIdBodyParam,
    middleware.validateExpiration,
    controller.createRefreshToken
);

module.exports = router;