
module.exports = function( sequelize, DataTypes ){
    var AccessLog = sequelize.define( 'AccessLog', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            user_id: {
                type: DataTypes.UUID,
                allowNull: true
            },

            ip: {
                type: DataTypes.STRING,
                allowNull: true
            },

            service_provider: {
                type: DataTypes.STRING,
                allowNull: true
            },
            city: {
                type: DataTypes.STRING,
                allowNull: true
            },
            state: {
                type: DataTypes.STRING,
                allowNull: true
            },
            country: {
                type: DataTypes.STRING,
                allowNull: true
            },
            longitude: {
                type: DataTypes.STRING,
                allowNull: true
            },
            latitude: {
                type: DataTypes.STRING,
                allowNull: true
            },
            timezone: {
                type: DataTypes.STRING,
                allowNull: true
            },

            user_agent: {
                type: DataTypes.STRING,
                allowNull: true
            },

            browser: {
                type: DataTypes.STRING,
                allowNull: true
            },

            browser_version: {
                type: DataTypes.STRING,
                allowNull: true
            },

            os: {
                type: DataTypes.STRING,
                allowNull: true
            },

            os_version: {
                type: DataTypes.STRING,
                allowNull: true
            },
            device: {
                type: DataTypes.STRING,
                allowNull: true
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
            tableName: 'access_logs'
        } );

    return AccessLog;
};


