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
    controller.getUsers
);

router.post(
    '/', 
    jsonParser,
    convertJsonToUrlEncoded,
    urlEncodedParser,
    authenticate( { scope: 'USER_CREATE' } ),
    middleware.validateUserCreation,
    controller.createUser
);

router.patch(
    '/', 
    jsonParser,
    convertJsonToUrlEncoded,
    urlEncodedParser,
    authenticate( {scope: 'USER_UPDATE_ASSIGNED,USER_UPDATE_ALL'} ),
    middleware.validateUserModification,
    controller.updateUser
);

router.delete(
    '/', 
    jsonParser,
    convertJsonToUrlEncoded,
    urlEncodedParser,
    authenticate( { scope: 'USER_DELETE' } ),
    middleware.validateUserDelete,
    controller.deleteUser
);

module.exports = router;