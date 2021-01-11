//imports
//npm libraries
const request = require('supertest');
const { Op } = require('sequelize');

//local libraries
const app = require('../../main');

const User = require('../../models/users');
const user = new User();

const RefreshToken = require('../../models/refreshTokens');

const Team = require('../../models/teams');

const { getRoles, getAdminScopeList, getRegularScopeList } = require('../../utilities/constants');
const TeamMember = require('../../models/teamMembers');

//defaults
//admin user
const adminUsername = "adminuser";
const adminPassword = "P@ssw0rd";
var adminClientId = "";

//tokens
var accessToken = "";
var refreshToken = "";

var refreshTokenList = []
var teams = [];
var membershipIds = [];

//teams
var teamId = "";

test("Create admin user", async () => {
    const parameters = {
        username: adminUsername,
        password: await user.generatePasswordHash(adminPassword),
        role: getRoles.indexOf("admin"),
        access: getAdminScopeList,
        status: 1 
    }

    var newUser = await User.create(parameters).then(data => {
        return data
    },
    error => {
        return undefined;
    });

    expect(newUser).not.toBeUndefined();
    adminClientId = newUser.id;
});

test("Create admin team", async () => {
    const parameters = {
        name: `${adminUsername}'s Team`,
        status: 1 
    }

    var adminTeam = await Team.create(parameters).then(data => {
        return data
    },
    error => {
        return undefined;
    });

    expect(adminTeam).not.toBeUndefined();
    teamId = adminTeam.id;
    teams.push(teamId);
});

test("Create admin team membership", async () => {
    const parameters = {
        role: 0,
        teamId: teamId,
        userId: adminClientId 
    }

    var adminTeamMembership = await TeamMember.create(parameters).then(data => {
        return data
    },
    error => {
        return undefined;
    });

    expect(adminTeamMembership).not.toBeUndefined();
    membershipIds.push(adminTeamMembership.id)
});

//Oauth 2 Server functionalities
test("Test the admin username and password for login grant", async () => {
    const response = await request(app)
        .post('/oauth/token')
        .send(`username=${adminUsername}&password=${adminPassword}`);


    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.accessTokenExpiration).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.refreshTokenExpiration).toBeDefined();
    expect(response.body.tokenType).toBe("Bearer");

    accessToken = response.body.accessToken;
    refreshToken = response.body.refreshToken;
    refreshTokenList.push(refreshToken);
});

test("Test request for refresh token revocation using admin credentials", async () => {
    const response = await request(app)
        .post('/oauth/revoke')
        .send(`refresh_token=${refreshToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body.code).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.message).toBeDefined();
});

test("Test password credentials grant using admin credentials", async () => {
    const response = await request(app)
        .post('/oauth/token')
        .send(`client_id=${adminUsername}&username=${adminUsername}&password=${adminPassword}&grant_type=password&scope=${getAdminScopeList.join(',')}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.accessTokenExpiration).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.refreshTokenExpiration).toBeDefined();
    expect(response.body.tokenType).toBe("Bearer");

    accessToken = response.body.accessToken;
    refreshToken = response.body.refreshToken;
    refreshTokenList.push(refreshToken);
});

//TODO: uncomment if enabling the refresh token grant
// test("Test refresh token credentials grant using admin credentials", async () => {
//     const response = await request(app)
//         .post('/oauth/token')
//         .auth(adminClientId, adminPassword, { type: "basic" })
//         .send(`grant_type=refresh_token&refresh_token=${refreshToken}`);

//     console.log(response.body);
//     expect(response.statusCode).toBe(200);
//     expect(response.body).toBeDefined();
//     expect(response.body.accessToken).toBeDefined();
//     expect(response.body.accessTokenExpiration).toBeDefined();
//     expect(response.body.refreshToken).toBeDefined();
//     expect(response.body.refreshTokenExpiration).toBeDefined();
//     expect(response.body.tokenType).toBe("Bearer");

//     accessToken = response.body.accessToken;
//     refreshToken = response.body.refreshToken;
//     refreshTokenList.push(refreshToken);
// });

//TODO: uncomment if enabling the refresh token grant
// test("Test user refresh token credentials grant using admin credentials", async () => {
//     const response = await request(app)
//         .post('/oauth/token')
//         .send(`grant_type=user_refresh_token&refresh_token=${refreshToken}`);

//     console.log(response.body);
//     expect(response.statusCode).toBe(200);
//     expect(response.body).toBeDefined();
//     expect(response.body.accessToken).toBeDefined();
//     expect(response.body.accessTokenExpiration).toBeDefined();
//     expect(response.body.refreshToken).toBeDefined();
//     expect(response.body.refreshTokenExpiration).toBeDefined();
//     expect(response.body.tokenType).toBe("Bearer");

//     accessToken = response.body.accessToken;
//     refreshToken = response.body.refreshToken;
//     refreshTokenList.push(refreshToken);
// });

//TODO: uncomment if enabling the client credentials grant
// test("Test client credentials grant using admin credentials", async () => {
//     const response = await request(app)
//         .post('/oauth/token')
//         .auth(adminUsername, adminPassword, { type: "basic" })
//         .send(`grant_type=client_credentials&scope=admin`);

//     expect(response.statusCode).toBe(200);
//     expect(response.body).toBeDefined();
//     expect(response.body.accessToken).toBeDefined();
//     expect(response.body.accessTokenExpiration).toBeDefined();
//     expect(response.body.tokenType).toBe("Bearer");

//     accessToken = response.body.accessToken;
// });

//TODO: uncomment if enabling the authorization code grant
// test("Test request for authorization admin credentials", async () => {
//     const response = await request(app)
//         .post('/oauth/authorize')
//         .set('Authorization', `Bearer ${accessToken}`)
//         .send(`client_id=${adminUsername}&response_type=code&scope=admin&redirectUri=http://localhost:3030/oauth/token`);

//     expect(response.statusCode).toBe(200);
//     expect(response.body).toBeDefined();
//     expect(response.body.authorizationCode).toBeDefined();
//     expect(response.body.expiresAt).toBeDefined();
//     expect(response.body.redirectUri).toBeDefined();

//     authorizationCode = response.body.authorizationCode;
//     redirectUri = response.body.redirectUri;
// });

// test("Test authorization grant using admin credentials", async () => {
//     const response = await request(app)
//         .post('/oauth/token')
//         .auth(adminUsername, '', { type: "basic" })
//         .send(`grant_type=authorization_code&code=${authorizationCode}&redirect_uri=${redirectUri}`);

//     expect(response.statusCode).toBe(200);
//     expect(response.body).toBeDefined();
//     expect(response.body.accessToken).toBeDefined();
//     expect(response.body.accessTokenExpiration).toBeDefined();
//     expect(response.body.refreshToken).toBeDefined();
//     expect(response.body.refreshTokenExpiration).toBeDefined();
//     expect(response.body.tokenType).toBe("Bearer");

//     accessToken = response.body.accessToken;
//     refreshToken = response.body.refreshToken;
//     refreshTokenList.push(refreshToken);
// });

//revoke all user refresh token
test("Test request for refresh token revocation of all user token", async () => {
    const response = await request(app)
        .delete('/oauth/revoke/all')
        .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body.code).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.message).toBeDefined();
});

//Clean up
test("Delete refresh tokens generated", async () => {

    const deletedTokens = await RefreshToken.destroy({
        where: {
            token: {
                [Op.in]: refreshTokenList
            }
        },
        force: true
    });

    expect(deletedTokens).not.toBeUndefined();
});

test("Delete memberships", async () => {

    const deletedUser = await TeamMember.destroy({
        where: {
            id: {
                [Op.in]: membershipIds
            }
        },
        force: true
    });

    expect(deletedUser).not.toBeUndefined();
});

test("Delete user", async () => {

    const deletedUser = await User.destroy({
        where: {
            username: {
                [Op.in]: [adminUsername]
            }
        },
        force: true
    });

    expect(deletedUser).not.toBeUndefined();
});

test("Delete teams", async () => {

    const deletedTeam = await Team.destroy({
        where: {
            id: {
                [Op.in]: teams
            }
        },
        force: true
    });

    expect(deletedTeam).not.toBeUndefined();
});