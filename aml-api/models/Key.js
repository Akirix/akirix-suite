
module.exports = function( sequelize, DataTypes ){
    var Key = sequelize.define( 'Key',
        {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            client_id: {
                type: DataTypes.UUID,
                allowNull: false
            },

            value: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },

            expires: {
                type: DataTypes.DATE,
                allowNull: true,
                validate: {
                    isDate: true
                }
            }
        },
        {
            tableName: 'keys'
        } );
    return Key;
};