
module.exports = function( sequelize, DataTypes ){
    var ExternalNode = sequelize.define( 'ExternalNode', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            node_id: {
                type: DataTypes.UUID,
                allowNull: false
            },
            project_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify project_id'
                    }
                }
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true
            },
            point_of_contact: {
                type: DataTypes.STRING,
                allowNull: true
            },
            phone: {
                type: DataTypes.STRING,
                allowNull: true
            },
            email: {
                type: DataTypes.STRING,
                allowNull: true
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true
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
            tableName: 'external_nodes',
            associate: function( models ){
                ExternalNode.belongsTo( models.Node );
                ExternalNode.belongsTo( models.Project );
            },
            instanceMethods: {
                toJSON: function(){
                    var values = this.get();
                    return values;
                }
            }
        } );

    return ExternalNode;
};
