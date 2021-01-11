//imports
//npm libraries
const { Sequelize, DataTypes, Model, Op } = require('sequelize');

//for validation of regex and password
const PasswordValidator = require('password-validator');

//for password hashing
const bcrypt = require('bcrypt');

//for hashing to sha256
const crypto = require('crypto');

//for environment
require('dotenv').config();

//local libraries

//for database instance
const { sequelize } = require('../utilities/db');

const { regex } = require('../utilities/constants');

class User extends Model {

    //check if the string is a valid username
    isValidUserName(username) {

        var schema = new PasswordValidator();
        schema
        .is().min(1)
        .is().max(128)
        .has().not(regex.username)
        
        return username != null && username != undefined && schema.validate(username);
    }

    //check if the string is existiting username in the database
    async isUserNameExists(string) {
        return await User.count({
            where: {
                username: {
                    [Op.eq]: string
                }
            }
        }).then(
            data => {
                return data > 0;
            },
            error => {
                return undefined;
            }
        )
    }

    //check if the string is existiting username in the database
    async isUserNameExistsExceptForId(id, string) {
        return await User.count({
            where: {
                username: {
                    [Op.eq]: string
                },
                id: {
                    [Op.ne]: id
                }
            }
        }).then(
            data => {
                return data > 0;
            },
            error => {
                return undefined;
            }
        )
    }

    //check if the string is a valid password
    isValidPassword(password) {

        var schema = new PasswordValidator();
        schema
        .is().min(8)
        .is().max(64)
        .has().uppercase()
        .has().lowercase()
        .has().digits()
        // .has().symbols()
        .has().not().spaces();
        
        return password != null && password != undefined && schema.validate(password);
    }

    //generate hash for the password
    async generatePasswordHash(password){
        var sha256PW = crypto.createHash('sha256').update(password).digest('base64');
        return await bcrypt.hash(sha256PW, parseInt(process.env.HASH_SALT_ROUND)).then(hash => {
            return hash;
        }).catch(error => {
            return undefined;
        })
    }

    //comparing hashes
    async comparePasswordHash(plain, hash){
        var sha256PW = crypto.createHash('sha256').update(plain).digest('base64');
        return await bcrypt.compare(sha256PW, hash).then(result => {
            return result == true;
        }).catch(error => {
            return false;
        })
    }

}

User.init({
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
    },
    username: {
        type: DataTypes.STRING(128),
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    //to support from previous version of authentication
    salt: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.INTEGER,
        //0 - inactive
        //1 - active
        //2 - blocked
        //3 - deleted
        defaultValue: 0
    },
    role: {
        type: DataTypes.INTEGER,
        //0 - admin
        //1 - regular
        defaultValue: 1
    },
    access: {
        type: DataTypes.ARRAY(DataTypes.STRING)
    },
    isTemporary: {
        field: 'is_temporary',
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    emailAddress: {
        field: 'email_address',
        type: DataTypes.STRING(128)
    },
    contactNumber: {
        field: 'contact_number',
        type: DataTypes.STRING(32)
    }
}, {
    sequelize,
    timestamps: true,
    paranoid: true,
    createdAt: 'created',
    updatedAt: 'modified',
    deletedAt: 'deleted',
    modelName: 'users',
    indexes: [
        {
            unique: true,
            fields: ['username']
        },
    ]
});

module.exports = User;