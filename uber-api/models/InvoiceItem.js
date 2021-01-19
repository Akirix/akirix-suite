module.exports = function( sequelize, DataTypes ){
    var InvoiceItem = sequelize.define( 'InvoiceItem', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true
            },
            unit: {
                type: DataTypes.STRING,
                allowNull: true
            },
            price: {
                type: DataTypes.DECIMAL( 14, 5 ),
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isDecimal: true
                }
            },
            quantity: {
                type: DataTypes.DECIMAL( 14, 5 ),
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isDecimal: true,
                    min: 0
                }
            },
            invoice_id: {
                type: DataTypes.UUID,
                allowNull: true,
                defaultValue: null,
                validate: {
                    notEmpty: {
                        msg: 'Must specify invoice_id'
                    }
                }
            }
        },
        {
            tableName: 'invoice_items'
        } );
    return InvoiceItem;
};
