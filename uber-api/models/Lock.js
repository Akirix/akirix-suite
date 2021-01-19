module.exports = function( sequelize, DataTypes ){
    var Lock = sequelize.define( 'Lock',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify user_id'
                    }
                }
            },
            uber_user_id: {
                type: DataTypes.UUID,
                allowNull: true
            },
            message: {
                type: DataTypes.STRING,
                validate: {
                    notEmpty: true
                }
            },
            status: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                },
                defaultValue: 1
            }
        },
        {
            tableName: 'locks'
        } );

    return Lock;
};
