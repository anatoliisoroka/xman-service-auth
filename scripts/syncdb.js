#!/usr/bin/env node

//imports

//local models
const userModel = require('../models/users');
const refreshTokenModel = require('../models/refreshTokens');
const teamModel = require('../models/teams');
const teamMemberModel = require('../models/teamMembers');

//process of syncing models
console.log('Started syncing user model');
const syncDb = async () => {
    console.log('started syncing users');
    await userModel
            .sequelize
            .sync({ alter: true })
            .then( () => {
                console.log('Finished syncing user model');
            }).catch(
                error => {
                    console.log(`Got an error syncing user model: ${error}`);
                    process.exit(1);
                }
            );

    console.log('started syncing refresh tokens');
    await refreshTokenModel
            .sequelize
            .sync({ alter: true })
            .then( () => {
                console.log('Finished syncing refresh token model');
            }).catch(
                error => {
                    console.log(`Got an error syncing refresh token model: ${error}`);
                    process.exit(1);
                }
            );

    console.log('started syncing teams');
    await teamModel
            .sequelize
            .sync({ alter: true })
            .then( () => {
                console.log('Finished syncing teams model');
            }).catch(
                error => {
                    console.log(`Got an error syncing teams model: ${error}`);
                    process.exit(1);
                }
            );
    console.log('started syncing team members');
    await teamMemberModel
            .sequelize
            .sync({ alter: true })
            .then( () => {
                console.log('Finished syncing team members model');
            }).catch(
                error => {
                    console.log(`Got an error syncing team members model: ${error}`);
                    process.exit(1);
                }
            );

    process.exit();
};

syncDb();