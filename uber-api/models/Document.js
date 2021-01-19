
module.exports = function( sequelize, DataTypes ){
    var Document = sequelize.define( 'Document', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            company_id: {
                type: DataTypes.UUID,
                allowNull: true
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true
            },
            type: {
                type: DataTypes.STRING,
                allowNull: true
            },
            model: {
                type: DataTypes.STRING,
                allowNull: true
            },
            model_id: {
                type: DataTypes.UUID,
                allowNull: true
            },
            status: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1, 2 ]
                    ]
                },
                comment: '0: Incomplete. 1: Complete, 2: Deleted'
            },
            s3_uri: {
                type: DataTypes.STRING,
                allowNull: true
            }

        },
        {
            tableName: 'documents',
            associate: function( models ){

            }
        } );
    return Document;
}
