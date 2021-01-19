

module.exports = function( sequelize, DataTypes ){
    var CompanyWireInstructions = sequelize.define( 'CompanyWireInstruction', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            wire_instruction_id: {
                type: DataTypes.UUID,
                allowNull: false
            },

            company_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify company_id'
                    }
                }
            }
        },
        {
            tableName: 'company_wire_instructions'
        } );

    return CompanyWireInstructions;
};
