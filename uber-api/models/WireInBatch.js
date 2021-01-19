module.exports = function( sequelize, DataTypes ){
    var WireInBatch = sequelize.define( 'WireInBatch', {
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
            size: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            date: {
                type: DataTypes.DATE,
                allowNull: true
            },
            type: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1, 2 ]
                    ]
                },
                comment: '0: Wire, 1: ACH, 2: ACH Return'
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
            tableName: 'wire_in_batches'
        } );

    return WireInBatch;
}
