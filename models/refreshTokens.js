//imports
//npm libraries
const { Sequelize, DataTypes, Model, Op } = require('sequelize');

//for uuid
const { v4: uuidv4 } = require('uuid');

//local libraries
//for database instance
const { sequelize } = require('../utilities/db');

//user model for foreign key
const User = require('./users');

class RefreshToken extends Model {

    async generateToken() {
        var uuid = null;

        while (uuid === null) {
            uuid = uuidv4();

            var count = await RefreshToken.count({
                where: {
                    token: {
                        [Op.eq]: uuid
                    }
                }
            });

            if (count > 0) {
                uuid = null;
            } else {
                break;
            }
        }
        
        return uuid;
    }

}

RefreshToken.init({
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
    },
    token: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
    },
    expiration: {
        type: DataTypes.DATE
    },
    //TODO: remove if successfully deployed new scope implementation
    scope: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: ['regular']
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
    modelName: 'refresh_tokens',
    indexes: [
        {
            unique: true,
            fields: ['token']
        }
    ]
});

User.hasMany(RefreshToken, { as: 'tokens' });
RefreshToken.belongsTo(User, { as: 'user' } );

module.exports = RefreshToken;