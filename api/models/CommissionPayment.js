

module.exports = function( sequelize, DataTypes ){
    var CommissionPayment = sequelize.define( 'CommissionPayment', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            affiliate_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify affiliate_id'
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

            payout_date: {
                type: DataTypes.DATE,
                allowNull: false,
                validate: {
                    isDate: {
                        msg: 'Must specify a payout date'
                    }
                }
            },


            amount: {
                type: DataTypes.DECIMAL( 14, 2 ),
                allowNull: false,
                defaultValue: 0.00,
                validate: {
                    isDecimal: true,
                    min: 0
                }
            },
            status: {
                type: DataTypes.INTEGER( 1 ),
                allowNull: false,
                validate: {
                    isIn: [
                        [ 0, 1, 2 ]
                    ]
                },
                defaultValue: 0
            }
        },
        {
            tableName: 'commission_payments',
            associate: function( models ){
                CommissionPayment.hasMany( models.CommissionPaymentItem );
            }
        } );

    return CommissionPayment;
}
