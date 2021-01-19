

module.exports = function( sequelize, DataTypes ){
    var Wire = sequelize.define( 'Wire', {

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

            wire_batch_id: {
                type: DataTypes.UUID,
                allowNull: true
            },

            account_id: {
                type: DataTypes.UUID,
                allowNull: true
            },

            company_id: {
                type: DataTypes.UUID,
                allowNull: true
            },

            first_user_id: {
                type: DataTypes.UUID,
                allowNull: true
            },

            second_user_id: {
                type: DataTypes.UUID,
                allowNull: true
            },

            name: {
                type: DataTypes.STRING,
                allowNull: true
            },

            notes: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            notes_akirix: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            fee: {
                type: DataTypes.DECIMAL( 14, 2 ),
                allowNull: false,
                defaultValue: 0.00,
                validate: {
                    isDecimal: true,
                    min: 0
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

            method: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1, 2 ]
                    ]
                },
                comment: '0: Wire, 1: ACH, 2: Internal'
            },

            type: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1, 2 ]
                    ]
                },
                comment: '0: Out, 1: In, 2: Internal'
            },

            status: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1, 2, 3, 4, 5, 6, 9 ]
                    ]
                },
                comment: "0: Pending, 1: Started, 2: Completed, 3: Cancelled, 4: On Hold, 5: Rejected"
            },

            speedwire: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            bank_name: {
                type: DataTypes.STRING,
                allowNull: true
            },

            bank_address: {
                type: DataTypes.STRING,
                allowNull: true
            },

            bank_city: {
                type: DataTypes.STRING,
                allowNull: true
            },

            bank_state_province: {
                type: DataTypes.STRING,
                allowNull: true
            },

            bank_postal_code: {
                type: DataTypes.STRING,
                allowNull: true
            },

            bank_country: {
                type: DataTypes.STRING,
                allowNull: true
            },

            bank_phone: {
                type: DataTypes.STRING,
                allowNull: true
            },

            code_swift: {
                type: DataTypes.STRING,
                allowNull: true
            },

            code_aba: {
                type: DataTypes.STRING,
                allowNull: true
            },

            code_irc: {
                type: DataTypes.STRING,
                allowNull: true
            },

            account_holder: {
                type: DataTypes.STRING,
                allowNull: true
            },

            account_number: {
                type: DataTypes.STRING,
                allowNull: true
            },

            account_iban: {
                type: DataTypes.STRING,
                allowNull: true
            },

            account_holder_dob: {
                type: DataTypes.STRING,
                allowNull: true
            },

            account_holder_nationality: {
                type: DataTypes.STRING,
                allowNull: true
            },

            account_holder_address: {
                type: DataTypes.STRING,
                allowNull: true
            },

            account_holder_city: {
                type: DataTypes.STRING,
                allowNull: true
            },

            account_holder_state_province: {
                type: DataTypes.STRING,
                allowNull: true
            },

            account_holder_postal_code: {
                type: DataTypes.STRING,
                allowNull: true
            },

            account_holder_country: {
                type: DataTypes.STRING,
                allowNull: true
            },

            confirmation: {
                type: DataTypes.STRING,
                allowNull: true,
                set: function( v ){
                    if( !this.selectedValues.hasOwnProperty( 'confirmation' ) ){
                        return this.setDataValue( 'confirmation', v );
                    }
                    else{
                        delete this.selectedValues.confirmation;
                    }
                }
            },

            intermediary_bank_code_aba: {
                type: DataTypes.STRING,
                allowNull: true
            },

            intermediary_bank_code_swift: {
                type: DataTypes.STRING,
                allowNull: true
            },

            intermediary_bank_name: {
                type: DataTypes.STRING,
                allowNull: true
            },

            intermediary_bank_address: {
                type: DataTypes.STRING,
                allowNull: true
            },

            intermediary_bank_city: {
                type: DataTypes.STRING,
                allowNull: true
            },

            intermediary_bank_state_province: {
                type: DataTypes.STRING,
                allowNull: true
            },

            intermediary_bank_postal_code: {
                type: DataTypes.STRING,
                allowNull: true
            },

            intermediary_bank_country: {
                type: DataTypes.STRING,
                allowNull: true
            },

            purpose: {
                type: DataTypes.STRING,
                allowNull: true
            },

            beneficiary_type: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: true,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                }
            }
        },
        {
            tableName: 'wires',
            associate: function( models ){
                Wire.belongsTo( models.Company );
                Wire.belongsTo( models.BankRoute );
            },
            instanceMethods: {
                toJSON: function(){
                    var values = this.get();
                    return values;
                }
            }
        } );

    return Wire;
};
