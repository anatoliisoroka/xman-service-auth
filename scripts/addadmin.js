#!/usr/bin/env node

//imports
//npm libraries

//models
const User = require('../models/users');
const Team = require('../models/teams');
const TeamMember = require('../models/teamMembers');
const { getAdminScopeList, getTeamSpecificAdminScopeList } = require('../utilities/constants');

//adding of user function
const addAdminUser = async () => {
    console.log('Welcome to Creation of User CLI');
    const user = new User();
    
    //username and password
    var username = 'admin';

    var isExists = await user.isUserNameExists(username);

    console.log(isExists);
            
    if(isExists || isExists == undefined){
        console.log('Username already exists');
        process.exit();
    } else {

        const parameters = {
            username: username,
            password: await user.generatePasswordHash('P@ssw0rd'),
            access: getAdminScopeList,
            status: 1
        }
    
        console.log(`Will be adding: ${parameters} as a user`);
    
        var newUser = await User.create(parameters).then(data => {
            return data
        },
        error => {
            return undefined;
        });
    
        if (newUser === undefined){
            console.log('Failed adding the user. Please try again');
            process.exit(1);
        }

        const teamParams = {
            name: `${newUser.username}'s Team`,
            status: 1 
        }

        var adminTeam = await Team.create(teamParams).then(data => {
            return data
        },
        error => {
            return undefined;
        });

        if (adminTeam === undefined) {
            console.log('Failed adding the team. Please try again');
            process.exit(1);
        }

        const memberParams = {
            access: getTeamSpecificAdminScopeList,
            teamId: adminTeam.id,
            userId: newUser.id 
        }
    
        var adminTeamMembership = await TeamMember.create(memberParams).then(data => {
            return data
        },
        error => {
            return undefined;
        });

        if (adminTeamMembership === undefined) {
            console.log('Failed adding the team member. Please try again');
            process.exit(1);
        }
    
        console.log(`added a new user with uid of ${newUser.id}`);
    
        process.exit();
    }
};

addAdminUser();
