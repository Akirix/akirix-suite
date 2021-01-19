module.exports = function( sequelize, DataTypes ){
    var Token = sequelize.define( 'Token',
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
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify user_id'
                    }
                }
            },
            company_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify company_id'
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
            tableName: 'tokens',
            timestamps: false
        } );
    return Token;
};
