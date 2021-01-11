//imports
//npm libraries
//for validation of regex and password
const PasswordValidator = require('password-validator');

//for phonenumber validation
const { parsePhoneNumber } = require('libphonenumber-js');

//local libraries
const { regex } = require('../utilities/constants');

exports.isValidEmailAddress = (email) => {

    var schema = new PasswordValidator();
    schema
    .is().min(1)
    .is().max(128)
    .has(regex.email)
    
    return email != null && email != undefined && schema.validate(email);
}

//check if the string is a valid phone number
exports.isValidContactNumber = (string) => {

    try {
        const phoneNumber = parsePhoneNumber(string);
    } catch (error) {
        return false;
    }

    return true;
}