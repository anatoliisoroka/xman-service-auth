#!/usr/bin/env node

//imports
const { Op } = require('sequelize');

require('dotenv').config()

//models
const User = require('../models/users');

//constants
const { getAdminScopeList, getRegularScopeList } = require('../utilities/constants');

(async () => {

    console.log('Starting Migrating User Role to User Access Column');
    try{

        var adminIds = [];
        var regularIds = [];
        
        const users = await User.findAll();

        users.map(
            user => {
                if (!user.access) {
                    //update the access to specific role
                    if (user.role === 0) {
                        adminIds.push(user.id);
                    } else {
                        regularIds.push(user.id);
                    }
                }
            }
        )

        if (adminIds.length > 0) {
            await User.update(
                {
                    access: getAdminScopeList
                },
                {
                    where: {
                        id: {
                            [Op.in]: adminIds
                        }
                    }
                }
            )
        }

        if (regularIds.length > 0) {

            await User.update(
                {
                    access: getRegularScopeList
                },
                {
                    where: {
                        id: {
                            [Op.in]: regularIds
                        }
                    }
                }
            )

        }

        console.log('Finished Migrating to roles to access');
    } catch (error) {
        console.log(error.message);
    }

    process.exit();

})();