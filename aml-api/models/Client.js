module.exports = function( sequelize, DataTypes ){
    var Client = sequelize.define( 'Client',
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

            name: {
                type: DataTypes.STRING,
                allowNull: false,
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
            }
        },
        {
            tableName: 'clients'
        } );

    return Client;
};
