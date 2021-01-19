module.exports = function( sequelize, DataTypes ){
    var Alias = sequelize.define( 'Alias',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            alias: {
                type: DataTypes.STRING,
                allowNull: false
            }
        },
        {
            tableName: 'aliases'
        } );
    return Alias;
};