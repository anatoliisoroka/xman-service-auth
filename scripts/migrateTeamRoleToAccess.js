#!/usr/bin/env node

//imports
const { Op } = require('sequelize');

require('dotenv').config()

//models
const TeamMember = require('../models/teamMembers');

//constants
const { getTeamSpecificAdminScopeList, getTeamSpecificEditorScopeList, getTeamSpecificAgentScopeList } = require('../utilities/constants');

(async () => {

    console.log('Starting Migrating Team Role to Team Member Access Column');
    try{

        var adminIds = [];
        var editorIds = [];
        var agentIds = [];
        
        const memberships = await TeamMember.findAll();

        memberships.map(
            membership => {
                if (!membership.access) {
                    //update the access to specific role
                    if (membership.role === 0) {
                        adminIds.push(membership.id);
                    } 

                    if (membership.role === 1) {
                        editorIds.push(membership.id)
                    }

                    if (membership.role === 2) {
                        agentIds.push(membership.id)
                    }
                }
            }
        )

        if (adminIds.length > 0) {
            await TeamMember.update(
                {
                    access: getTeamSpecificAdminScopeList
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

        if (editorIds.length > 0) {

            await TeamMember.update(
                {
                    access: getTeamSpecificEditorScopeList
                },
                {
                    where: {
                        id: {
                            [Op.in]: editorIds
                        }
                    }
                }
            )

        }

        if (agentIds.length > 0) {

            await TeamMember.update(
                {
                    access: getTeamSpecificAgentScopeList
                },
                {
                    where: {
                        id: {
                            [Op.in]: agentIds
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