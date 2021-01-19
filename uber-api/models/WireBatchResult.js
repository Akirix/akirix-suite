module.exports = function( sequelize, DataTypes ){
    var WireBatchResult = sequelize.define( 'WireBatchResult', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            bank_route_id: {
                type: DataTypes.UUID,
                allowNull: false
            },
            filename: {
                type: DataTypes.STRING,
                allowNull: true
            },
            raw_data: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            file_date: {
                type: DataTypes.DATE,
                allowNull: true
            },
            type: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                },
                comment: '0: Acknowledgment, 1: Confirmation'
            },
            status: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                },
                comment: "0: New, 1: Processed"
            }

        },
        {
            tableName: 'wire_batch_results'
        } );

    return WireBatchResult;
};
