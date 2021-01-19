
module.exports = function( sequelize, DataTypes ){
    var InfoRequest = sequelize.define( 'InfoRequest', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            title: {
                type: DataTypes.STRING,
                allowNull: false
            },

            model: {
                type: DataTypes.STRING,
                allowNull: true
            },

            model_id: {
                type: DataTypes.UUID,
                allowNull: true
            },

            type: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    isIn: [ [ 0, 1, 2 ] ]
                }
            },

            notes: {
                type: DataTypes.TEXT
            },

            deadline: {
                type: DataTypes.DATE,
                allowNull: false
            },

            response: {
                type: DataTypes.TEXT,
                defaultValue: null
            },

            status: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                defaultValue: 0,
                validations: {
                    isIn: [ 0, 1 ]
                }
            }
        },
        {
            tableName: 'info_requests'
        } );
    return InfoRequest;
};