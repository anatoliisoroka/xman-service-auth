#!/usr/bin/env node

//imports
//npm libraries
const prompt = require('prompt-sync')({sigint: true});

//models
const User = require('../models/users');

//adding of user function
const addUser = async () => {
    console.log('Welcome to Creation of User CLI');
    const user = new User();
    
    //username and password
    var username = null;

    while(username === null){
        username = prompt('Enter username [Required]: ').trim();
        if(!user.isValidUserName(username)){
            username = null
        } else{
            var isExists = await user.isUserNameExists(username);
            
            if(isExists || isExists == undefined){
                console.log('Username already exists');
                username = null;
            }
        }
        
    }

    var password = null;

    while(password == null) {
        password = prompt('Enter password [Required]: ', {echo: ''});
        if (!user.isValidPassword(password)){
            console.log('The password must be 1 uppercase, 1 lowercase, 1 numeric, 1 special character. It must be within 8 to 64 characters.')
            password = null;
        }
    }

    //role
    var role = null;
    const role_options = ['admin', 'regular'];
    while(role === '' || role === null || role_options.indexOf(role.toLowerCase()) == -1){
        role = prompt('Enter role [Required] (regular or admin): ', {echo: ''})
    }

    const parameters = {
        username: username,
        password: await user.generatePasswordHash(password),
        role: role_options.indexOf(role.toLowerCase()) 
    }

    console.log(`Will be adding: ${parameters} as a user`);

    var newUser = await User.create(parameters).then(data => {
        return data
    },
    error => {
        return undefined;
    });

    if (newUser == undefined){
        console.log('Failed adding the user. Please try again')
    }

    console.log(`added a new user with uid of ${newUser.id}`);

    process.exit();

};

addUser();
