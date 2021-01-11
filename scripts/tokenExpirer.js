#!/usr/bin/env node

//imports
const { Op, Sequelize } = require('sequelize');

require('dotenv').config()

//models
const RefreshToken = require('../models/refreshTokens');

(async () => {

    console.log('Starting Deleting Expired Refresh Tokens');
    try{
        await RefreshToken.destroy(
            {
                where: {
                    expiration: {
                        [Op.lt]: Sequelize.fn('NOW'),
                        [Op.ne]: null
                    }
                },
                force: true
            }
        )
        
        console.log('Finished Deleting Expired Refresh Tokens');
    } catch (error) {
        console.log(error.message);
    }

    process.exit();

})();