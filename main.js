//imports
//npm libraries
//instantiate express
const express = require('express');

//for swagger documentation
const swaggerUi = require('swagger-ui-express');

//cors
const cors = require('cors');

//for environment variables
require('dotenv').config();

//local libraries

//import routes
const oauthRoute = require('./modules/oauth/router');
const userRoute = require('./modules/user/router');
const notificationRoute = require('./modules/notification/router');
const teamRoute = require('./modules/team/router');
const tokenRoute = require('./modules/tokens/router');
const memberRoute = require('./modules/member/router');
const waHookRoute = require('./modules/wa-hook/router');
const scopeRoute = require('./modules/scope/router')
const contactsHookRoute = require('./modules/contacts-hook/router');

//swagger document
const swaggerDocument = require('./docs/swagger-doc.json');

//instantiate app
const app = express();

//middlewares
if (process.env.APP_MODE !== 'prod') {
    app.use(require('morgan')('dev'));
}

//cors policy
app.use(cors());

//routes
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/oauth', oauthRoute);
app.use('/users', userRoute);
app.use('/public', express.static('./public'));
app.use('/notify', notificationRoute);
app.use('/teams', teamRoute);
app.use('/tokens', tokenRoute);
app.use('/members', memberRoute);
app.use('/wa-hook', waHookRoute);
app.use('/scopes', scopeRoute);
app.use('/contacts-hook', contactsHookRoute);
app.use('/', express.static('./build'));

module.exports = app;