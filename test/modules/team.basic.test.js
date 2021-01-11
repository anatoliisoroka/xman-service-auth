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

const { getRoles, getAdminScopeList, getRegularScopeList, getTeamSpecificAdminScopeList, getTeamSpecificEditorScopeList } = require('../../utilities/constants');
const TeamMember = require('../../models/teamMembers');

//defaults
//admin user
const adminUsername = "adminuser";
const adminPassword = "P@ssw0rd";
var adminClientId = "";

//regular user
const regularUsername = "regularuser";
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
var teamId2 = "";

//invite code
var inviteCode = "";

test("Create admin user", async () => {
    const parameters = {
        username: adminUsername,
        password: await user.generatePasswordHash(adminPassword),
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
        teamId: teamId,
        userId: adminClientId,
        access: getTeamSpecificAdminScopeList
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

test("Test request for fetching of teams", async () => {
    const response = await request(app)
        .get(`/teams`)
        .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.code).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined();
    expect(response.body.meta).toBeDefined();
});

test("Test request for creation of new team", async () => {
    const response = await request(app)
        .post(`/teams`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send( {email: "sample@email.com", name: "Sample Team", number: "+639123456789", notify_email: true, notify_wa: true, status: "activated" } );

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.code).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined();
    expect(response.body.meta).toBeDefined();

    teamId2 = response.body.meta.id;
    teams.push(teamId2);
});

test("Test request for update of a specific team", async () => {
    const response = await request(app)
        .patch(`/teams`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send( { id: teamId2, email: "sample@email.com", name: "Sample Team Revised", number: "+639123456789", notify_email: true, notify_wa: true, status: "activated" } );

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.code).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined();
});

test("Test request for fetching of team link", async () => {
    const response = await request(app)
        .get(`/teams/link?id=${teamId2}`)
        .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.code).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined();
    expect(response.body.meta).toBeDefined();
    expect(response.body.meta.invite_link).toBeDefined();
});

test("Test request for fetching of new team link", async () => {
    const response = await request(app)
        .post(`/teams/link?id=${teamId2}`)
        .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.code).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined();
    expect(response.body.meta).toBeDefined();
    expect(response.body.meta.invite_link).toBeDefined();

    const url = new URLSearchParams(response.body.meta.invite_link.split('?')[1]);
    inviteCode = url.get('code');
});

test("Test request for enabling of team link", async () => {
    const response = await request(app)
        .post(`/teams/link/enable`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send( { id: teamId2, is_link_sharing_enabled: true } );

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.code).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined();
});

test("Test request for joining via team link", async () => {
    const response = await request(app)
        .post(`/teams/join/${inviteCode}`)
        .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.code).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined();
});

test("Test request for switching team", async () => {
    const response = await request(app)
        .post(`/teams/switch`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send( { id: teamId, user_id: adminClientId } );

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.code).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined();
});

test("Test fetching of team members", async () => {
    const response = await request(app)
        .get(`/members`)
        .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.code).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined();
    expect(response.body.meta).toBeDefined();
});

test("Test creating a team member", async () => {
    const response = await request(app)
        .post(`/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send( { username: regularUsername, password: regularPassword, status: "inactive", access: getTeamSpecificEditorScopeList } );

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.code).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined();
    expect(response.body.meta).toBeDefined();

    regularClientId = response.body.meta.id;
});

test("Test updating a team member", async () => {
    const response = await request(app)
        .patch(`/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send( { user_id: regularClientId, team_id: teamId, access: getTeamSpecificEditorScopeList } );

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.code).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined();
    expect(response.body.meta).toBeDefined();
});

test("Test request for delete of a specific team member", async () => {
    const response = await request(app)
        .delete(`/members?user_id=${regularClientId}`)
        .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.code).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined();
});

test("Test request for delete of a specific team", async () => {
    const response = await request(app)
        .delete(`/teams?id=${teamId2}`)
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
                [Op.in]: [adminUsername, regularUsername]
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