//imports
//npm libraries
const express = require('express');

//local libraries
//authenticate middleware
const { authenticate } = require('../oauth/middleware');

//controller
const notificationController = require('./controller');
const notificationMiddleware = require('./middleware');

//initialize router
const router = express.Router();

//parsers
const jsonParser = express.json();
const urlEncodedParser = express.urlencoded( { extended: true} );

router.post(
    '/', 
    jsonParser,
    urlEncodedParser,
    authenticate( {scope: 'TEAM_NOTIFY' } ),
    notificationMiddleware.validatePostNotification,
    notificationController.notify
);

module.exports = router;