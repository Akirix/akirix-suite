module.exports = function( sequelize, DataTypes ){
    var Announcement = sequelize.define( 'Announcement', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            publish_from: {
                type: DataTypes.DATE,
                allowNull: true,
                validate: {
                    isDate: true
                }
            },
            publish_to: {
                type: DataTypes.DATE,
                allowNull: true,
                validate: {
                    isDate: true
                }
            }
        },
        {
            tableName: 'announcements'
        } );
    return Announcement;
};
