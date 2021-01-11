//imports
//npm imports
const fs = require('fs');
require('dotenv').config();

constants = {}

constants.regex = {
    username: /[!#\$%\^\&\*\(\)\[\]\\\|\{\}\;\:\"\,\<\>\/\?\'\`\~\+\s]+/i, //characters that must not be included
    name: /[!#\$%\^\&\*\(\)\[\]\\\|\{\}\;\:\"\,\<\>\/\?\'\`\~\+]+/i, //characters that must not be included,
    email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i, //email address regex
}

constants.httpStatus = {
    error: 'error',
    success: 'success'
}

constants.getOauthConfig = {
    //all grant types are supported in the code ['authorization_code', 'password', 'refresh_token', 'client_credentials']
    grants: ['password'],
    allowBearerTokensInQueryString: true,
    accessTokenLifetime: 3600, //1 hour
    refreshTokenLifetime: 2592000, //30 days
    authorizationCodeLifetime: 300, //5 minutes
    allowEmptyState: true,
    allowExtendedTokenAttributes: true,
    requireClientAuthentication: {
        password: false,
        refresh_token: false,
        authorization_code: false,
    }
}

constants.getScopeList = [
    'WA_STATE', // open, close, logout
    'WA_NEW_MESSAGE_ASSIGNED', // send a new message to assigned conversations
    // CRUD on contacts
    'CONTACTS_READ_ASSIGNED',
    'CONTACTS_READ_ALL',
    'CONTACTS_CREATE',
    'CONTACTS_DELETE',
    'CONTACTS_UPDATE',
    // CRUD on campaigns
    'CAMPAIGNS_READ',
    'CAMPAIGNS_CREATE',
    'CAMPAIGNS_DELETE',
    'CAMPAIGNS_UPDATE',
    // CRUD on keywords
    'KEYWORD_READ',
    'KEYWORD_CREATE',
    'KEYWORD_DELETE',
    'KEYWORD_UPDATE',
    // CRUD on message flows
    'FLOWS_READ', 
    'FLOWS_CREATE',
    'FLOWS_DELETE',
    'FLOWS_UPDATE',
    // CRUD on tags
    'TAGS_READ',
    'TAGS_CREATE',
    'TAGS_DELETE',
    //Service Auth
    //CRUD on users
    'USER_READ_ALL',
    'USER_CREATE',
    'USER_UPDATE_ASSIGNED',
    'USER_UPDATE_ALL',
    'USER_DELETE',
    //CRUD on teams
    'TEAM_READ_ALL',
    'TEAM_CREATE',
    'TEAM_UPDATE_ASSIGNED',
    'TEAM_UPDATE_ALL',
    'TEAM_DELETE',
    'TEAM_SWITCH_ASSIGNED',
    'TEAM_SWITCH_ALL',
    //CRUD on teams Link
    'TEAM_LINK_READ_ASSIGNED',
    'TEAM_LINK_READ_ALL',
    'TEAM_LINK_UPDATE_ASSIGNED',
    'TEAM_LINK_UPDATE_ALL',
    'TEAM_LINK_CREATE',
    'TEAM_LINK_JOIN',
    //CRUD on members
    'MEMBER_READ_ASSIGNED',
    'MEMBER_READ_ALL',
    'MEMBER_CREATE_ASSIGNED',
    'MEMBER_CREATE_ALL',
    'MEMBER_UPDATE_ASSIGNED',
    'MEMBER_UPDATE_ALL',
    'MEMBER_DELETE_ASSIGNED',
    'MEMBER_DELETE_ALL',
    //CRUD on Tokens
    'TOKEN_READ_ALL',
    'TOKEN_CREATE',
    'TOKEN_DELETE_ASSIGNED',
    'TOKEN_DELETE_ALL',
    'TEAM_NOTIFY',
    'WA_HOOK',
    'ADMIN_PANEL_LOGIN'
]

constants.getTeamSpecificScopeList = [
    //CRUD on teams
    'TEAM_UPDATE_ASSIGNED',
    'TEAM_SWITCH_ASSIGNED',
    //CRUD on teams Link
    'TEAM_LINK_READ_ASSIGNED',
    'TEAM_LINK_UPDATE_ASSIGNED',
    //CRUD on members
    'MEMBER_READ_ASSIGNED',
    'MEMBER_CREATE_ASSIGNED',
    'MEMBER_UPDATE_ASSIGNED',
    'MEMBER_DELETE_ASSIGNED',
]

constants.getTeamSpecificAdminScopeList = [
    //CRUD on teams
    'TEAM_UPDATE_ASSIGNED',
    'TEAM_SWITCH_ASSIGNED',
    //CRUD on teams Link
    'TEAM_LINK_READ_ASSIGNED',
    'TEAM_LINK_UPDATE_ASSIGNED',
    //CRUD on members
    'MEMBER_READ_ASSIGNED',
    'MEMBER_CREATE_ASSIGNED',
    'MEMBER_UPDATE_ASSIGNED',
    'MEMBER_DELETE_ASSIGNED',
]

constants.getTeamSpecificEditorScopeList = [
    //CRUD on teams
    'TEAM_UPDATE_ASSIGNED',
    'TEAM_SWITCH_ASSIGNED',
    //CRUD on teams Link
    'TEAM_LINK_READ_ASSIGNED',
    'TEAM_LINK_UPDATE_ASSIGNED',
    //CRUD on members
    'MEMBER_READ_ASSIGNED',
    'MEMBER_UPDATE_ASSIGNED',
]

constants.getTeamSpecificAgentScopeList = [
    //CRUD on teams
    'TEAM_SWITCH_ASSIGNED',
    //CRUD on teams Link
    'TEAM_LINK_READ_ASSIGNED',
    //CRUD on members
    'MEMBER_READ_ASSIGNED'
]

constants.getRegularScopeList = [
    'WA_STATE', // open, close, logout
    'WA_NEW_MESSAGE_ASSIGNED', // send a new message to assigned conversations
    // CRUD on contacts
    'CONTACTS_READ_ASSIGNED',
    'CONTACTS_READ_ALL',
    'CONTACTS_CREATE',
    'CONTACTS_DELETE',
    'CONTACTS_UPDATE',
    // CRUD on campaigns
    'CAMPAIGNS_READ',
    'CAMPAIGNS_CREATE',
    'CAMPAIGNS_DELETE',
    'CAMPAIGNS_UPDATE',
    // CRUD on keywords
    'KEYWORD_READ',
    'KEYWORD_CREATE',
    'KEYWORD_DELETE',
    'KEYWORD_UPDATE',
    // CRUD on message flows
    'FLOWS_READ', 
    'FLOWS_CREATE',
    'FLOWS_DELETE',
    'FLOWS_UPDATE',
    // CRUD on tags
    'TAGS_READ',
    'TAGS_CREATE',
    'TAGS_DELETE',
    //Service Auth
    //CRUD on users
    'USER_UPDATE_ASSIGNED',
    //CRUD on teams
    'TEAM_LINK_JOIN',
    //CRUD on Tokens
    'TOKEN_DELETE_ASSIGNED',
    'TEAM_NOTIFY'
]

constants.getAdminScopeList = [
    'WA_STATE', // open, close, logout
    'WA_NEW_MESSAGE_ASSIGNED', // send a new message to assigned conversations
    // CRUD on contacts
    'CONTACTS_READ_ASSIGNED',
    'CONTACTS_READ_ALL',
    'CONTACTS_CREATE',
    'CONTACTS_DELETE',
    'CONTACTS_UPDATE',
    // CRUD on campaigns
    'CAMPAIGNS_READ',
    'CAMPAIGNS_CREATE',
    'CAMPAIGNS_DELETE',
    'CAMPAIGNS_UPDATE',
    // CRUD on keywords
    'KEYWORD_READ',
    'KEYWORD_CREATE',
    'KEYWORD_DELETE',
    'KEYWORD_UPDATE',
    // CRUD on message flows
    'FLOWS_READ', 
    'FLOWS_CREATE',
    'FLOWS_DELETE',
    'FLOWS_UPDATE',
    // CRUD on tags
    'TAGS_READ',
    'TAGS_CREATE',
    'TAGS_DELETE',
    //Service Auth
    //CRUD on users
    'USER_READ_ALL',
    'USER_CREATE',
    'USER_UPDATE_ASSIGNED',
    'USER_UPDATE_ALL',
    'USER_DELETE',
    //CRUD on teams
    'TEAM_READ_ALL',
    'TEAM_CREATE',
    'TEAM_UPDATE_ALL',
    'TEAM_DELETE',
    'TEAM_SWITCH_ALL',
    //CRUD on teams Link
    'TEAM_LINK_READ_ALL',
    'TEAM_LINK_UPDATE_ALL',
    'TEAM_LINK_CREATE',
    'TEAM_LINK_JOIN',
    //CRUD on members
    'MEMBER_READ_ALL',
    'MEMBER_CREATE_ALL',
    'MEMBER_UPDATE_ALL',
    'MEMBER_DELETE_ALL',
    //CRUD on Tokens
    'TOKEN_READ_ALL',
    'TOKEN_CREATE',
    'TOKEN_DELETE_ASSIGNED',
    'TOKEN_DELETE_ALL',
    'TEAM_NOTIFY',
    'WA_HOOK',
    'ADMIN_PANEL_LOGIN'
]

constants.getTeamTokenScopeList = [
    'TEAM_NOTIFY',
]

constants.getOauthAlgorithm = 'ES256';

constants.privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH);
constants.publicKey = fs.readFileSync(process.env.PUBLIC_KEY_PATH);

constants.getRoles = ["admin", "regular"];
constants.getTeamRoles = ["admin", "editor", "agent"];

constants.getStatus = ["inactive", "activated", "blocked", "deleted"]

constants.getGoogleTokenPath = 'token.json';
constants.getGoogleCredentialsPath = 'credentials.json';
constants.getGoogleScopes = [
    'https://www.googleapis.com/auth/gmail.compose'
];

constants.getWaEvent = ['open', 'close'];
constants.getContactsEvent = ['contacts-update'];

constants.getNotification = {
    user: {
        email: {
            subject: 'Activate your xman Account',
            body: `
            Welcome to xman<br><br>
            The following is your login information:<br><br>
            Link: <a href="https://app.xman.tech/" target="_blank">app.xman.tech</a><br>
            Account: {{username}} <br>
            Password: {{password}} <br><br>
            Scan the QR Code in our system with WhatsApp Web after you login. You can use it officially after synchronization. <br><br>
            <a href="https://bit.ly/36YWi1Y" target="_blank">xman 3.0 Learning Guide</a><br>
            <a href="https://bit.ly/35QjIrl" target="_blank">xman 3.0 FAQ Library</a><br>
            <a href="https://bit.ly/35OjgcU" target="_blank">How to broadcast</a><br><br>
            <a href="https://bit.ly/xmanPDP" target="_blank">Privacy Policy</a><br>
            <a href="https://bit.ly/xmanSTA" target="_blank">Service Terms & Agreement</a><br><br>
            歡迎使用xman<br><br>
            以下是你的登入資料:<br><br>
            鏈結: <a href="https://app.xman.tech/" target="_blank">app.xman.tech</a><br>
            帳戶: {{username}} <br>
            密碼: {{password}} <br><br>
            登入後用WhatsApp Web掃描QR Code，完成同步後便可以正式使用！  <br><br>
            <a href="https://bit.ly/35CJNtB" target="_blank">xman 3.0 使用教學</a><br>
            <a href="https://bit.ly/3lQUHSt" target="_blank">xman 3.0 疑難排解</a><br>
            <a href="https://bit.ly/36HwHKT" target="_blank">Broadcast 群發信息教學</a><br><br>
            <a href="https://bit.ly/xmanPDP" target="_blank">隱私權政策</a><br>
            <a href="https://bit.ly/xmanSTA" target="_blank">使用條款</a><br><br>
            `
        },
        wa: {
            text: `*Activate your xman Account*\n\nWelcome to xman\n\nThe following is your login information:\n\nLink: https://app.xman.tech/\nAccount: {{username}}\nPassword: {{password}}\n\nScan the QR Code in our system with WhatsApp Web after you login. You can use it officially after synchronization.\n\nxman 3.0 Learning Guide | https://bit.ly/36YWi1Y\nxman 3.0 FAQ Library | https://bit.ly/35QjIrl\nHow to broadcast | https://bit.ly/35OjgcU\n\nPrivacy Policy | https://bit.ly/xmanPDP\nService Terms & Agreement | https://bit.ly/xmanSTA\n\n歡迎使用xman\n\n以下是你的登入資料:\n\鏈結: https://app.xman.tech/\帳戶: {{username}}\密碼: {{password}}\n\n登入後用WhatsApp Web掃描QR Code，完成同步後便可以正式使用！\n\nxman 3.0 使用教學 | https://bit.ly/35CJNtB\nxman 3.0 疑難排解 | https://bit.ly/3lQUHSt\nBroadcast 群發信息教學 | https://bit.ly/36HwHKT\n\n隱私權政策 | https://bit.ly/xmanPDP\n使用條款 | https://bit.ly/xmanSTA`
        }
    },
    member: {
        email: {
            subject: 'Activate your xman Account',
            body: `
            Welcome to xman<br><br>
            The following is your login information:<br><br>
            Link: <a href="https://app.xman.tech/" target="_blank">app.xman.tech</a><br>
            Account: {{username}} <br>
            Password: {{password}} <br><br>
            Scan the QR Code in our system with WhatsApp Web after you login. You can use it officially after synchronization. <br><br>
            <a href="https://bit.ly/36YWi1Y" target="_blank">xman 3.0 Learning Guide</a><br>
            <a href="https://bit.ly/35QjIrl" target="_blank">xman 3.0 FAQ Library</a><br>
            <a href="https://bit.ly/35OjgcU" target="_blank">How to broadcast</a><br><br>
            <a href="https://bit.ly/xmanPDP" target="_blank">Privacy Policy</a><br>
            <a href="https://bit.ly/xmanSTA" target="_blank">Service Terms & Agreement</a><br><br>
            歡迎使用xman<br><br>
            以下是你的登入資料:<br><br>
            鏈結: <a href="https://app.xman.tech/" target="_blank">app.xman.tech</a><br>
            帳戶: {{username}} <br>
            密碼: {{password}} <br><br>
            登入後用WhatsApp Web掃描QR Code，完成同步後便可以正式使用！  <br><br>
            <a href="https://bit.ly/35CJNtB" target="_blank">xman 3.0 使用教學</a><br>
            <a href="https://bit.ly/3lQUHSt" target="_blank">xman 3.0 疑難排解</a><br>
            <a href="https://bit.ly/36HwHKT" target="_blank">Broadcast 群發信息教學</a><br><br>
            <a href="https://bit.ly/xmanPDP" target="_blank">隱私權政策</a><br>
            <a href="https://bit.ly/xmanSTA" target="_blank">使用條款</a><br><br>
            `
        },
        wa: {
            text: `*Activate your xman Account*\n\nWelcome to xman\n\nThe following is your login information:\n\nLink: https://app.xman.tech/\nAccount: {{username}}\nPassword: {{password}}\n\nScan the QR Code in our system with WhatsApp Web after you login. You can use it officially after synchronization.\n\nxman 3.0 Learning Guide | https://bit.ly/36YWi1Y\nxman 3.0 FAQ Library | https://bit.ly/35QjIrl\nHow to broadcast | https://bit.ly/35OjgcU\n\nPrivacy Policy | https://bit.ly/xmanPDP\nService Terms & Agreement | https://bit.ly/xmanSTA\n\n歡迎使用xman\n\n以下是你的登入資料:\n\鏈結: https://app.xman.tech/\帳戶: {{username}}\密碼: {{password}}\n\n登入後用WhatsApp Web掃描QR Code，完成同步後便可以正式使用！\n\nxman 3.0 使用教學 | https://bit.ly/35CJNtB\nxman 3.0 疑難排解 | https://bit.ly/3lQUHSt\nBroadcast 群發信息教學 | https://bit.ly/36HwHKT\n\n隱私權政策 | https://bit.ly/xmanPDP\n使用條款 | https://bit.ly/xmanSTA`
        }
    },
    wa_hook: {
        email: {
            new_connection: {
                subject: 'Welcome to xman',
                body: `
                Hello,<br><br>
                This is to inform that you have signed into xman Live Chat with the phone number: {{phone_number}}!<br><br>
                Thank you!
                `
            },
            disconnection: {
                subject: 'WhatsApp Disconnected from xman',
                body: `
                Hello,<br><br>
                This is to inform that you have been disconnected from WhatsApp, please log in again from https://app.xman.tech. Apologies for the inconvenience!<br><br>
                Thank you!`
            },
            replaced: {
                subject: 'WhatsApp Disconnected from xman',
                body: `
                Hello,<br><br>
                This is to inform that you have opened your WhatsApp somewhere, please log in again from https://app.xman.tech to connect again.<br><br>
                Thank you!`
            }
        },
        wa: {
            new_connection: {
                subject: 'Welcome to xman',
                body: `Hello,\n\nThis is to inform that you have signed into xman Live Chat with the phone number: {{phone_number}}!\n\nThank you!`
            },
            disconnection: {
                subject: 'WhatsApp Disconnected from xman',
                body: `Hello\n\nThis is to inform that you have been disconnected from WhatsApp, please log in again from https://app.xman.tech. Apologies for the inconvenience!\n\nThank you!`
            },
            replaced: {
                subject: 'WhatsApp Disconnected from xman',
                body: `Hello,\n\nThis is to inform that you have opened your WhatsApp somewhere, please log in again from https://app.xman.tech to connect again.\n\nThank you!`
            }
        }

    },
    contacts_hook: {
        email: {
            subject: 'New Contacts Assigned',
            body: `
            Hello,<br><br>
            This is to inform that you have new assigned contacts in your account. Below are the list of contacts assigned to you:<br>
            <b>{{contact_list}}</b><br><br>
            Thank you!`
        },
        wa: {
            subject: 'New Contacts Assigned',
            body: `Hello,\n\nThis is to inform that you have new assigned contacts in your account. Below are the list of contacts assigned to you:\n*{{contact_list}}*\n\nThank you!`
        }

    }
}

constants.getMaxTeamMembers = 10;

module.exports = constants;