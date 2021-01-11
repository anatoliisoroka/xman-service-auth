//imports
//npm libraries

//local libraries
//for user model
const User = require('../../models/users');
const user = new User();

test('Test if user model function isUserNameExists(username) is working', () => {
    return user.isUserNameExists('').then(data => {
        expect(data).not.toBeUndefined();
    });
})

test('Test if user model function isUserNameExistsExceptForId(id, username) is working', () => {
    return user.isUserNameExistsExceptForId('289168f7-ac9e-44e0-bb70-e20d96b53347', '').then(data => {
        expect(data).not.toBeUndefined();
    });
})

test('Test if user model function isValidUserName(string) can validate a value', () => {
    //plain text
    expect(user.isValidUserName('juanpenduko')).toBeTruthy();
    //plain text with space
    expect(user.isValidUserName('juan penduko')).toBeFalsy();
    //plain text with underscore
    expect(user.isValidUserName('juan_penduko')).toBeTruthy();
    //plain text with period
    expect(user.isValidUserName('juan.penduko')).toBeTruthy();
    //empty string
    expect(user.isValidUserName('')).toBeFalsy();
    //white spaces
    expect(user.isValidUserName('     ')).toBeFalsy();
    //128 alphanumeric characters
    expect(user.isValidUserName('SJakXLOXrO2InUsB4uZMZb3GeZZY6yjTEXIZfikZ4ipSsRw9JH6SkghTtyPSok6dwYLk1qVkz8gthOwiuunx86JakU0MHNgjrLPdKgy2JSruT8lQiZdKrpEfZdKrpEfs')).toBeTruthy();
    //129 alphanumeric characters
    expect(user.isValidUserName('SJakXLOXrO2InUsB4uZMZb3GeZZY6yjTEXIZfikZ4ipSsRw9JH6SkghTtyPSok6dwYLk1qVkz8gthOwiuunx86JakU0MHNgjrLPdKgy2JSruT8lQiZdKrpEfZdKrpEfss')).toBeFalsy();
    //129 alphanumeric with symbol characters
    expect(user.isValidUserName('SJakXLOXrO2InUsB4uZMZb3GeZZY6yjTEXIZfikZ4ipSsRw9JH6SkghTtyPSok6dwYLk1qVkz8gthOwiuunx86JakU0MHNgjrLPdKgy2JSruT8lQiZdKrpEfZdKrpEfs!')).toBeFalsy();
    //null username
    expect(user.isValidUserName(null)).toBeFalsy();
    //undefined username
    expect(user.isValidUserName(undefined)).toBeFalsy();
})

test('Test if user model function isValidPassword(string) can validate a value', () => {
    //password with 1 digit 1 symbol and combination of lowercase and uppercase characters
    expect(user.isValidPassword('P@ssw0rd')).toBeTruthy();
    //4 charactes with 1 digit 1 symbol and combination of lowercase and uppercase
    expect(user.isValidPassword('P@s5')).toBeFalsy();
    //password with small characters and a space
    expect(user.isValidPassword('pass word')).toBeFalsy();
    //password with small characters and a underscore
    expect(user.isValidPassword('pass_word')).toBeFalsy();
    //password with empty string
    expect(user.isValidPassword('')).toBeFalsy();
    //white spaces password
    expect(user.isValidPassword('     ')).toBeFalsy();
    //76 characters with symbol and digits
    expect(user.isValidPassword('SJakXLOXrO2InUs@B4uZMZb3GeZZY6yjTEXIZfikZ4ipSsasdfsaaf3423sdsfsfuZMZb3GeZZY6')).toBeFalsy();
    //null password
    expect(user.isValidPassword(null)).toBeFalsy();
    //undefined password
    expect(user.isValidPassword(undefined)).toBeFalsy();
})

test('Test if user model function generatePasswordHash(password) can generate a value', () => {
    return user.generatePasswordHash('sample').then(data => {
        console.log(data);
        expect(data).toBeDefined();
    });
})

test('Test if user model function comparePasswordHash(password) can generate a value', () => {
    return user.comparePasswordHash('sample', '$2b$10$YPVoSf7MPSsy48mUZm1po.KCaoKw8ziosFpdsdqylaM8t08kyAg0.').then(data => {
        expect(data).toBeTruthy();
    });
})