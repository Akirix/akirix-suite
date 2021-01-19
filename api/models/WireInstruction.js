module.exports = function( sequelize, DataTypes ){
    var WireInstruction = sequelize.define( 'WireInstruction', {
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
            name: {
                type: DataTypes.STRING,
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
            aba_routing_number: {
                type: DataTypes.STRING,
                allowNull: true
            },
            swift_code: {
                type: DataTypes.STRING,
                allowNull: true
            },
            sort_code: {
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
            intermediary_bank_name: {
                type: DataTypes.STRING,
                allowNull: true
            },
            intermediary_bank_address: {
                type: DataTypes.STRING,
                allowNull: true
            },
            intermediary_swift: {
                type: DataTypes.STRING,
                allowNull: true
            },
            intermediary_aba_routing_number: {
                type: DataTypes.STRING,
                allowNull: true
            },

            domestic: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0
            },
            international: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0
            },
            method_wire: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0
            },
            method_ach: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0
            },
        },
        {
            tableName: 'wire_instructions',
            timestamps: false,
            associate: function( models ){
                WireInstruction.belongsTo( models.Currency );
            },
        } );
    return WireInstruction;
};
