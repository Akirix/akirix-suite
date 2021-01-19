
module.exports = function( sequelize, DataTypes ){
    var UberUser = sequelize.define( 'UberUser',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    isEmail: true
                }
            },
            first_name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },
            last_name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },
            hash: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },
            phone_mobile: {
                type: DataTypes.STRING,
                allowNull: true
            },
            access: {
                type: DataTypes.TEXT,
                allowNull: true,
                validate: {
                    notEmpty: true
                }
            },
            status: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                }
            }
        },
        {
            tableName: 'uber_users',
            associate: function( models ){
            }
        } );

    return UberUser;
}
