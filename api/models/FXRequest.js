
module.exports = function( sequelize, DataTypes ){
    var FXRequest = sequelize.define( 'FXRequest', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            from_account_id: {
                type: DataTypes.UUID,
                allowNull: false
            },

            to_account_id: {
                type: DataTypes.UUID,
                allowNull: true
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

            name: {
                type: DataTypes.STRING,
                allowNull: true
            },

            base_currency_id: {
                type: DataTypes.STRING( 3 ),
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify base_currency_id'
                    }
                }
            },

            base_amount: {
                type: DataTypes.DECIMAL( 14, 2 ),
                allowNull: false,
                defaultValue: 0.00,
                validate: {
                    isDecimal: true,
                    min: 0
                }
            },

            counter_currency_id: {
                type: DataTypes.STRING( 3 ),
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify counter_currency_id'
                    }
                }
            },

            counter_amount: {
                type: DataTypes.DECIMAL( 14, 2 ),
                allowNull: false,
                defaultValue: 0.00,
                validate: {
                    isDecimal: true,
                    min: 0
                }
            },

            base_rate: {
                type: DataTypes.DECIMAL( 19, 6 ),
                allowNull: false,
                validate: {
                    isDecimal: true,
                    min: 0
                }
            },


            customer_rate: {
                type: DataTypes.DECIMAL( 19, 6 ),
                allowNull: false,
                validate: {
                    isDecimal: true,
                    min: 0
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
                comment: '0: Internal , 1: Wire'
            },

            status: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1, 2, 3, 4 ]
                    ]
                },
                comment: "0: Pending, 1: Started, 2: Completed, 3: Cancelled, 4: On Hold"
            },

            reference: {
                type: DataTypes.UUID,
                allowNull: true
            },

            notes: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            confirmation: {
                type: DataTypes.STRING,
                allowNull: true,
                set: function( v ){
                    if( !this.selectedValues.hasOwnProperty( 'confirmation' ) ){
                        return this.setDataValue( 'confirmation', v );
                    } else{
                        delete this.selectedValues.confirmation;
                    }
                }
            }
        },
        {
            tableName: 'fx_requests',
            associate: function( models ){
                FXRequest.belongsTo( models.Company );
            },
            instanceMethods: {
                toJSON: function () {
                    var values = this.get();
                    delete values.base_rate;
                    return values;
                }
            }
        } );
    return FXRequest;
};