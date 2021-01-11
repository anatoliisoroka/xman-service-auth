#!/usr/bin/env node

//imports
const { Op } = require('sequelize');

require('dotenv').config()

//models
const Team = require('../models/teams');
const TeamMember = require('../models/teamMembers');
const User = require('../models/users');

(async () => {

    console.log('Starting Migrating Email and Wa to Team Admin');
    try{
        const teams = await Team.findAll(
            {
                where: {
                    [Op.or]: {
                        emailAddress: {
                            [Op.ne]: null
                        },
                        contactNumber: {
                            [Op.ne]: null
                        }
                    }
                }
            }
        )

        if(teams.length > 0) {
            for (var i = 0; i < teams.length; i++) {
                const member = await TeamMember.findOne(
                    {
                        where: {
                            teamId: {
                                [Op.eq]: teams[i].id
                            }
                        },
                        order: [ ['created', 'ASC'] ]
                    }
                )

                if(member) {
        
                    const userMember = await User.findOne({
                        where: {
                            id: {
                                [Op.eq]: member.userId
                            }
                        }
                    })
                    
                    if (userMember) {
                        // update email and wa
                        await userMember.update(
                            {
                                emailAddress: teams[i].emailAddress,
                                contactNumber: teams[i].contactNumber
                            }
                        )
                    }
                }

            }
        }
        
        console.log('Finished Migrating Email and Wa to Team Admin');
    } catch (error) {
        console.log(error.message);
    }

    process.exit();

})();