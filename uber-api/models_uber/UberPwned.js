module.exports = function( sequelize, DataTypes ){
    var UberPwned = sequelize.define( 'UberPwned',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false
            },
            user_email: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    isEmail: true
                }
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true
            },
            breached_date: {
                type: DataTypes.DATE,
                allowNull: true
            },
            added_date: {
                type: DataTypes.DATE,
                allowNull: true
            },
            title: {
                type: DataTypes.STRING,
                allowNull: true
            },
            domain: {
                type: DataTypes.STRING,
                allowNull: true
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            data_classes: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            type: {
                type: DataTypes.INTEGER,
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
            tableName: 'uber_pwned'
        } );
    return UberPwned;
};
// 0= breached 1 = pasted