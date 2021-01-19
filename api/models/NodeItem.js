
module.exports = function( sequelize, DataTypes ){
    var NodeItem = sequelize.define( 'NodeItem', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            name: {
                type: DataTypes.STRING,
                allowNull: true
            },

            price: {
                type: DataTypes.DECIMAL( 14, 5 ),
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isDecimal: true,
                    min: 0
                }
            },

            project_id: {
                type: DataTypes.UUID,
                allowNull: true,
                defaultValue: null
            },

            node_id: {
                type: DataTypes.UUID,
                allowNull: true,
                defaultValue: null
            }
        },
        {
            tableName: 'node_items',
            associate: function( models ){
                NodeItem.belongsTo( models.Project );
                NodeItem.belongsTo( models.Node );
            }
        }
    );
    return NodeItem;
};
