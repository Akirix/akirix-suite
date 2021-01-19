module.exports = function( sequelize, DataTypes ){
    var UserSetting = sequelize.define( 'UserSetting', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false
            },
            show_welcome: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            show_getting_started: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
            }
        },
        {
            tableName: 'user_settings',
            associate: function( models ){
                UserSetting.belongsTo( models.User );
            }
        } );
    return UserSetting;
}
