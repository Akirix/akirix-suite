
module.exports = function( sequelize, DataTypes ){
    var Company = sequelize.define( 'Company',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            account_number: {
                type: DataTypes.STRING,
                unique: true,
                allowNull: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify a company name'
                    }
                }
            },

            type: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                }
            },
            status: {
                type:  DataTypes.INTEGER( 1 ).UNSIGNED,
                allowNull: false,
                defaultValue: 1,
                validate: {
                    isIn: [
                        [ 0, 1, 2 ]
                    ]
                }
            },
            phone: {
                type: DataTypes.STRING,
                allowNull: true
            },
            fax: {
                type: DataTypes.STRING,
                allowNull: true
            },
            email: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    isEmail: true
                }
            },
            website: {
                type: DataTypes.STRING,
                allowNull: true
            },
            address: {
                type: DataTypes.STRING,
                allowNull: true
            },
            city: {
                type: DataTypes.STRING,
                allowNull: true
            },
            state_province: {
                type: DataTypes.STRING,
                allowNull: true
            },
            postal_code: {
                type: DataTypes.STRING,
                allowNull: true
            },
            country: {
                type: DataTypes.STRING,
                allowNull: true
            },
            notes: {
                type: DataTypes.STRING,
                allowNull: true
            },
            dual_custody: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            affiliate: {
                type: DataTypes.INTEGER( 1 ).UNSIGNED,
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
            tableName: 'companies',
            associate: function( models ){
                Company.hasMany( models.User );
                Company.hasMany( models.Account );
                Company.hasMany( models.Node );
                Company.hasOne( models.Fee );
            }
        } );
    return Company;
};
