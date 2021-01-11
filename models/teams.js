//imports
//npm libraries
const { Sequelize, DataTypes, Model, Op } = require('sequelize');

//for validation of regex and password
const PasswordValidator = require('password-validator');

//for phonenumber validation
const { parsePhoneNumber } = require('libphonenumber-js');

//for crypto generation random string
const crypto = require('crypto');

require('dotenv').config();

//local libraries
//for database instance
const { sequelize } = require('../utilities/db');

const { regex } = require('../utilities/constants')

class Team extends Model {
    //check if the string is a valid email
    isValidEmailAddress(email) {

        //TODO: regex for email address
        var schema = new PasswordValidator();
        schema
        .is().min(1)
        .is().max(128)
        .has(regex.email)
        
        return email != null && email != undefined && schema.validate(email);
    }

    //check if the string is a valid email
    isValidName(string) {

        var schema = new PasswordValidator();
        schema
        .is().min(1)
        .is().max(255)
        
        return string != null && string != undefined && schema.validate(string.trim());
    }

    //check if the string is a valid phone number
    isValidContactNumber(string) {

        try {
            const phoneNumber = parsePhoneNumber(string);
        } catch (error) {
            return false;
        }

        return true;
    }

    async generateInviteCode() {
        var string = null;

        while (string === null) {
            string = await crypto.randomBytes(parseInt(process.env.INVITE_CODE_LENGTH || 16)).toString('hex').slice(0, parseInt(process.env.INVITE_CODE_LENGTH || 16));

            var count = await Team.count({
                where: {
                    inviteCode: {
                        [Op.eq]: string
                    }
                }
            });

            if (count > 0) {
                string = null;
            } else {
                break;
            }
        }
        
        return string;
    }
}

Team.init({
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
    },
    inviteCode: {
        field: 'invite_code',
        type: DataTypes.STRING(64),
    },
    isLinkSharingEnabled: {
        field: 'is_link_sharing_enabled',
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    emailAddress: {
        field: 'email_address',
        type: DataTypes.STRING(128)
    },
    contactNumber: {
        field: 'contact_number',
        type: DataTypes.STRING(32)
    },
    isNotifyEmail: {
        field: 'is_notify_email',
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    isNotifyWa: {
        field: 'is_notify_wa',
        type: DataTypes.BOOLEAN,
        defaultValue: true  
    },
    status: {
        type: DataTypes.INTEGER,
        //0 - inactive
        //1 - active
        //2 - blocked
        //3 - deleted
        defaultValue: 0
    },
}, {
    sequelize,
    timestamps: true,
    paranoid: true,
    createdAt: 'created',
    updatedAt: 'modified',
    deletedAt: 'deleted',
    modelName: 'teams',
    indexes: [
        {
            unique: true,
            fields: ['invite_code']
        },
    ]
});

module.exports = Team;