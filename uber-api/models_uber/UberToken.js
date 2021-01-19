module.exports = function( sequelize, DataTypes ){
    var UberToken = sequelize.define( 'UberToken',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            expires: {
                type: DataTypes.DATE,
                allowNull: false,
                validate: {
                    isDate: true
                }
            },
            two_factor_expires: {
                type: DataTypes.DATE,
                allowNull: true,
                validate: {
                    isDate: true
                }
            },
            uber_user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify uber_user_id'
                    }
                }
            },
            data: {
                type: DataTypes.TEXT,
                validate: {
                    notEmpty: true
                }
            },
            token: {
                type: DataTypes.STRING,
                unique: true,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },
            access: {
                type: DataTypes.TEXT,
                validate: {
                    notEmpty: true
                }
            }
        },
        {
            tableName: 'uber_tokens',
            timestamps: false
        } );

    return UberToken;
}
