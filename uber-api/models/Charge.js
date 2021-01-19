
module.exports = function( sequelize, DataTypes ){
    var Charge = sequelize.define( 'Charge', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
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

            account_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify account_id'
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

            type: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                },
                comment: '0: Single Time Fee Type, 1: Reoccurring Fee Type'
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

            start_date: {
                type: DataTypes.DATE,
                allowNull: false,
                validate: {
                    isDate: true
                }
            },

            title: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify title'
                    }
                }
            },

            notes: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            frequency: {
                type: DataTypes.INTEGER().UNSIGNED,
                allowNull: false,
                defaultValue: 1,
                validate: {
                    notEmpty: {
                        msg: 'Must give a frequency'
                    }
                }
            },

            frequency_type: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    isIn: [
                        [ 'day', 'week', 'month', 'year' ]
                    ]
                }
            },

            status: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 1,
                validate: {
                    isIn: [
                        [ 0, 1, 2 ]
                    ]
                },
                comment: '0: Active , 1: Canceled / Removed'
            },

            next_payment_date: {
                type: DataTypes.DATE,
                allowNull: true,
                validate: {
                    isDate: true
                }
            },

            fee_counter: {
                type: DataTypes.INTEGER().UNSIGNED,
                allowNull: true
            }
        },
        {
            tableName: 'charges',
            associate: function( models ){
                Charge.belongsTo( models.Currency );
            }
        } );
    return Charge;
};
