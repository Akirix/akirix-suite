module.exports = function( sequelize, DataTypes ){
    var CompanyWireInstruction = sequelize.define( 'CompanyWireInstruction', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            company_id: {
                type: DataTypes.UUID,
                allowNull: false
            },
            wire_instruction_id: {
                type: DataTypes.UUID,
                allowNull: false
            }
        },
        {
            tableName: 'company_wire_instructions',
            associate: function( models ){
                CompanyWireInstruction.belongsTo( models.Company );
            }
        } );
    return CompanyWireInstruction;
};