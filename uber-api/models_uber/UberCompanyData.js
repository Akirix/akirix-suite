module.exports = function( sequelize, DataTypes ){
    var UberCompanyData = sequelize.define( 'UberCompanyData',
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
            raw_data: {
                type: DataTypes.TEXT,
                allowNull: true
            }
        },
        {
            tableName: 'uber_company_data'
        } );
    return UberCompanyData;
};