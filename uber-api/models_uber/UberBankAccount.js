
module.exports = function( sequelize, DataTypes ){
    var UberBankAccount = sequelize.define( 'UberBankAccount', {

            id: {
                type: DataTypes.TEXT
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

            name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },

            bank_name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },

            type: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1, 2 ]
                    ]
                },
                comment: '0: Out, 1: In, 2: Holding'
            },
        },
        {
            tableName: 'uber_bank_accounts'
        } );
    return UberBankAccount;
};