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

router.post(
    '/', 
    jsonParser,
    urlEncodedParser,
    authenticate( {scope: 'WA_HOOK' } ),
    middleware.validatePostNotification,
    controller.notify
);

module.exports = router;