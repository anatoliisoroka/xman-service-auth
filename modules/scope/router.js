//imports
//npm libraries
const express = require('express');

//local libraries
//authenticate middleware
const { authenticate } = require('../oauth/middleware');

//controller
const controller = require('./controller');

//initialize router
const router = express.Router();

router.get(
    '/', 
    authenticate(),
    controller.get
);

router.get(
    '/public', 
    controller.getPublic
);

module.exports = router;