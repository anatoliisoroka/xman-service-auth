//imports
//npm libraries

//local libraries
//for user model
const RefreshToken = require('../../models/refreshTokens');
const refreshToken = new RefreshToken();

test('Test if refresh token model function generateToken() is working', () => {
    return refreshToken.generateToken().then(data => {
        expect(data).not.toBeUndefined();
    });
})