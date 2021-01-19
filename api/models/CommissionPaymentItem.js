

module.exports = function( sequelize, DataTypes ){
    var CommissionPaymentItem = sequelize.define( 'CommissionPaymentItem', {

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


            company_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify company_id'
                    }
                }
            },


            commission_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify commission_id'
                    }
                }
            },

            commission_payment_id: {
                type: DataTypes.UUID,
                allowNull: true
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


            currency_id: {
                type: DataTypes.STRING( 3 ),
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify currency_id'
                    }
                }
            },

            rate: {
                type: DataTypes.DECIMAL( 14, 4 ),
                allowNull: false,
                defaultValue: 0.00,
                validate: {
                    isDecimal: true,
                    min: 0
                }
            },

            period_from: {
                type: DataTypes.DATE,
                allowNull: false,
                validate: {
                    isDate: {
                        msg: 'Must specify a payout date'
                    }
                }
            },

            period_to: {
                type: DataTypes.DATE,
                allowNull: false,
                validate: {
                    isDate: {
                        msg: 'Must specify a payout date'
                    }
                }
            }
        },
        {
            tableName: 'commission_payment_items',
            associate: function( models ){
                CommissionPaymentItem.belongsTo( models.CommissionPayment );
            }
        } );

    return CommissionPaymentItem;
}
