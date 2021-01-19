

module.exports = function( sequelize, DataTypes ){
    var Amendment = sequelize.define( 'Amendment', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            node_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify node_id'
                    }
                }
            },
            status: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                validate: {
                    isIn: [
                        [ 0, 1, 2, 3 ]
                    ]
                },
                defaultValue: 0
            }
        },
        {
            tableName: 'amendments',
            associate: function( models ){
                Amendment.belongsTo( models.Node );
            }
        } );

    return Amendment;
}
