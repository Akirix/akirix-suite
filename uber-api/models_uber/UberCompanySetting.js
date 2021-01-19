module.exports = function( sequelize, DataTypes ){
    var UberCompanySetting = sequelize.define( 'UberCompanySetting',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            company_id: {
                type: DataTypes.UUID,
                allowNull: false
            },
            registration_id: {
                type: DataTypes.STRING,
                allowNull: true
            }
        },
        {
            tableName: 'uber_company_settings'
        } );
    return UberCompanySetting;
};
