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

//regular user
const regularUsername = "regularuser";
const regularUsername2 = "regularuser2";
const regularPassword = "P@ssw0rd";
var regularClientId = "";

//tokens
var accessToken = "";
var refreshToken = "";
var regularAccessToken = "";
var regularRefreshToken = "";

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

test("Test request for fetching of users", async () => {
    const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.code).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined();
    expect(response.body.meta).toBeDefined();
});

test("Test request for creation of user using admin credentials", async () => {
    const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ username: regularUsername, password: regularPassword, status: "inactive", access: getRegularScopeList });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.code).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined();
    expect(response.body.meta).toBeDefined();

    regularClientId = response.body.meta.id;
});

test("Test request for creation of user with email and mobile number", async () => {
    const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ username: regularUsername2, password: regularPassword, status: "inactive", access: getRegularScopeList, contactNumber: '639123456789', emailAddress: 'a@a.com' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.code).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined();
    expect(response.body.meta).toBeDefined();

});

test("Test request for modification with password", async () => {
    const response = await request(app)
        .patch(`/users`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ id: regularClientId, username: regularUsername, password: regularPassword, role: "regular", status: "activated" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.code).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined();
});

test("Test request for modification without password", async () => {
    const response = await request(app)
        .patch(`/users`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ id: regularClientId, username: regularUsername, role: "regular", status: "activated" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.code).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined();
});

test("Test the admin username and password for login grant", async () => {
    const response = await request(app)
        .post('/oauth/token')
        .send(`username=${regularUsername}&password=${regularPassword}`);


    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.accessTokenExpiration).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.refreshTokenExpiration).toBeDefined();
    expect(response.body.tokenType).toBe("Bearer");

    regularAccessToken = response.body.accessToken;
    regularRefreshToken = response.body.refreshToken;
    refreshTokenList.push(regularRefreshToken);
});

//delete user
test("Test request for deletion of user using admin credentials", async () => {
    const response = await request(app)
        .delete(`/users?id=${regularClientId}`)
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
                [Op.in]: [adminUsername, regularUsername, regularUsername2]
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