var builder = require('xmlbuilder');
var _ = require('lodash');
var moment = require('moment-timezone');
var config = require('../config/config.json');

function checkNull(text) {
    if (text === null) {
        return "";
    } else {
        return text;
    }
};

function checkNullSubstring( text, charCount ){
    return text ? text.trim().substring( 0, charCount ).trim() : text;
}

module.exports = function (sequelize, DataTypes) {
    var WireBatch = sequelize.define('WireBatch', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            currency_id: {
                type: DataTypes.STRING(3),
                allowNull: true,
                validate: {
                    notEmpty: {
                        msg: 'Must specify currency_id'
                    }
                }
            },
            bank_route_id: {
                type: DataTypes.UUID,
                allowNull: true
            },
            scheduled_time: {
                type: DataTypes.DATE,
                allowNull: false
            },
            amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.00
            },
            raw_data: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            response: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            type: {
                type: DataTypes.INTEGER(2),
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [0, 1, 2, 3]
                    ]
                }
            },

            status: {
                type: DataTypes.INTEGER(2),
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [0, 1, 2, 3]
                    ]
                }
            }

        },
        {
            tableName: 'wire_batches',
            associate: function (models) {
                WireBatch.hasMany(models.Wire);
                WireBatch.belongsTo(models.BankRoute);
            }
        });

    return WireBatch;
};
