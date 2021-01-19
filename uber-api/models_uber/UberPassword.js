
module.exports = function( sequelize, DataTypes ){
    return sequelize.define( 'UberPassword', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            uber_user_id: {
                type: DataTypes.UUID,
                allowNull: false
            },

            hash: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            }
        },
        {
            tableName: 'uber_passwords'
        }
    );
};