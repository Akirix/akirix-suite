
var math = require( 'mathjs' );
var Promise = require( 'promise' );

module.exports = function( sequelize, DataTypes ){
    var DailyBalance = sequelize.define( 'DailyBalance', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            account_id: {
                type:  DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify account_id'
                    }
                }
            },

            currency_id: {
                type: DataTypes.STRING( 3 ),
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify currency_id'
                    }
                }
            },

            balance: {
                type: DataTypes.DECIMAL( 14, 2 ),
                allowNull: false,
                defaultValue: 0.00,
                validate: {
                    isDecimal: true
                }
            }
        },
        {
            tableName: 'daily_balances'
        } );
    return DailyBalance;
};
