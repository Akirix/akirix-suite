module.exports = function( sequelize, DataTypes ){
    var BankRoute = sequelize.define( 'BankRoute',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            name: {
                type: DataTypes.STRING,
                validate: {
                    notEmpty: true
                }
            },
            raw_data_func: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            file_format: {
                type: DataTypes.TEXT,
                allowNull: true
            }
        },
        {
            tableName: 'bank_routes'
        } );

    return BankRoute;
};
