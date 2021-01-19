
module.exports = function( sequelize, DataTypes ){
    var UberException = sequelize.define( 'UberException', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            model: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must provide name to tag'
                    }
                }
            },

            model_id: {
                type: DataTypes.UUID,
                allowNull: false
            },

            uber_user_id: {
                type: DataTypes.UUID,
                allowNull: true
            },

            reason: {
                type: DataTypes.TEXT,
                allowNull: true

            },

            raw_data: {
                type:DataTypes.TEXT,
                allowNull: false
            },

            status: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1, 2 ]
                    ]
                }
            }
        },
        {
            tableName: 'uber_exceptions'
        } );
    return UberException;
};