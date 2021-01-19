module.exports = function( sequelize, DataTypes ){
    var WireTemplate = sequelize.define( 'WireTemplate', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            name: {
                type: DataTypes.STRING,
                allowNull: true
            },

            company_id: {
                type: DataTypes.UUID,
                allowNull: false
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

            notes: {
                type: DataTypes.TEXT,
                allowNull: true
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

            method: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: true,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                }
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
            tableName: 'wire_templates'
        } );

    return WireTemplate;
};
