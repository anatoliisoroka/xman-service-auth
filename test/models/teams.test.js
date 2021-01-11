//imports
//npm libraries

//local libraries
//for team model
const Team = require('../../models/teams');
const team = new Team();

test('Test if user model function isValidEmailAddress(string) can validate a value', () => {
    //plain text
    expect(team.isValidEmailAddress('juanpenduko@email.com')).toBeTruthy();
    //plain text with space
    expect(team.isValidEmailAddress('juan penduko@email.com')).toBeFalsy();
    //plain text with underscore
    expect(team.isValidEmailAddress('juan_penduko@email.com')).toBeTruthy();
    //plain text with period
    expect(team.isValidEmailAddress('juan.penduko@email.com')).toBeTruthy();
    //empty string
    expect(team.isValidEmailAddress('')).toBeFalsy();
    //white spaces
    expect(team.isValidEmailAddress('     ')).toBeFalsy();
    //128 alphanumeric characters
    expect(team.isValidEmailAddress('SJakXLOXrO2InUsB4uZMZb3GeZZY6yjTEXIZfikZ4ipSsRw9JH6SkghTtyPSok6dwYLk1qVkz8gthOwiuunx86JakU0MHNgjrLPdKgy2JSruT8lQiZdKrp@email.com')).toBeTruthy();
    //129 alphanumeric characters
    expect(team.isValidEmailAddress('SJakXLOXrO2InUsB4uZMZb3GeZZY6yjTEXIZfikZ4ipSsRw9JH6SkghTtyPSok6dwYLk1qVkz8gthOwiuunx86JakU0MHNgjrLPdKgy2JSruT8lQiZdKrpE@email.com')).toBeFalsy();
    //129 alphanumeric with symbol characters
    expect(team.isValidEmailAddress('SJakXLOXrO2InUsB4uZMZb3GeZZY6yjTEXIZfikZ4ipSsRw9JH6SkghTtyPSok6dwYLk1qVkz8gthOwiuunx86JakU0MHNgjrLPdKgy2JSruT8lQiZdKrp@email.com!')).toBeFalsy();
    //null email address
    expect(team.isValidEmailAddress(null)).toBeFalsy();
    //undefined email address
    expect(team.isValidEmailAddress(undefined)).toBeFalsy();
})

test('Test if team model function isValidName(string) can validate a value', () => {
    //plain text
    expect(team.isValidName('Sample Team')).toBeTruthy();
    //plain text with underscore
    expect(team.isValidName('Sample_Name')).toBeTruthy();
    //plain text with period
    expect(team.isValidName('Sample.Name')).toBeTruthy();
    //empty string
    expect(team.isValidName('')).toBeFalsy();
    //white spaces
    expect(team.isValidName('     ')).toBeFalsy();
    //128 alphanumeric characters
    expect(team.isValidName('SJakXLOXrO2InUsB4uZMZb3GeZZY6yjTEXIZfikZ4ipSsRw9JH6SkghTtyPSok6dwYLk1qVkz8gthOwiuunx86JakU0MHNgjrLPdKgy2JSruT8lQiZdKrp3zb3d6gf3v')).toBeTruthy();
    //255 alphanumeric characters
    expect(team.isValidName('SJakXLOXrO2InUsB4uZMZb3GeZZY6yjTEXIZfikZ4ipSsRw9JH6SkghTtyPSok6dwYLk1qVkz8gthOwiuunx86JakU0MHNgjrLPdKgy2JSruT8lQiZdKrp3zb3d6gf3vSJakXLOXrO2InUsB4uZMZb3GeZZY6yjTEXIZfikZ4ipSsRw9JH6SkghTtyPSok6dwYLk1qVkz8gthOwiuunx86JakU0MHNgjrLPdKgy2JSruT8lQiZdKrp3zb3d6gf3')).toBeTruthy();
    //256 alphanumeric with symbol characters
    expect(team.isValidName('SJakXLOXrO2InUsB4uZMZb3GeZZY6yjTEXIZfikZ4ipSsRw9JH6SkghTtyPSok6dwYLk1qVkz8gthOwiuunx86JakU0MHNgjrLPdKgy2JSruT8lQiZdKrp3zb3d6gf3vSJakXLOXrO2InUsB4uZMZb3GeZZY6yjTEXIZfikZ4ipSsRw9JH6SkghTtyPSok6dwYLk1qVkz8gthOwiuunx86JakU0MHNgjrLPdKgy2JSruT8lQiZdKrp3zb3d6gf3v')).toBeFalsy();
    //null name
    expect(team.isValidName(null)).toBeFalsy();
    //undefined name
    expect(team.isValidName(undefined)).toBeFalsy();
})

test('Test if user model function isValidContactNumber(string) can validate a value', () => {
    //plain text with correct format
    expect(team.isValidContactNumber('+639123456789')).toBeTruthy();
    //plain text formatted with start of 0
    expect(team.isValidContactNumber('09123456789')).toBeFalsy();
    //empty string
    expect(team.isValidContactNumber('')).toBeFalsy();
    //white spaces
    expect(team.isValidContactNumber('     ')).toBeFalsy();
    //null contact number
    expect(team.isValidContactNumber(null)).toBeFalsy();
    //undefined contact number
    expect(team.isValidContactNumber(undefined)).toBeFalsy();
})

