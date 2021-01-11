//imports
//npm libraries
const { Sequelize, DataTypes, Model } = require('sequelize');
//for environment
require('dotenv').config();

//local libraries

//for database instance
const { sequelize } = require('../utilities/db');

const Team = require('./teams');
const User = require('./users');

class TeamMember extends Model {}

TeamMember.init({
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
    },
    role: {
        type: DataTypes.INTEGER,
        //0 - admin
        //1 - editor
        //2 - agent
        defaultValue: 1
    },
    access: {
        type: DataTypes.ARRAY(DataTypes.STRING),
    },
    isDefault: {
        field: 'is_default',
        type: DataTypes.BOOLEAN,
        defaultValue: true  
    },
    isOriginal: {
        field: 'is_original',
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    sequelize,
    timestamps: true,
    paranoid: true,
    createdAt: 'created',
    updatedAt: 'modified',
    deletedAt: 'deleted',
    modelName: 'team_members',
    indexes: []
});


Team.hasMany(TeamMember);
User.hasMany(TeamMember);
TeamMember.belongsTo(User);
TeamMember.belongsTo(Team);


module.exports = TeamMember;