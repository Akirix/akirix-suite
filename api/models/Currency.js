
module.exports = function( sequelize, DataTypes ){
    var Currency = sequelize.define( 'Currency', {

            id: {
                type: DataTypes.STRING( 3 ),
                primaryKey: true
            },

            name: {
                type: DataTypes.STRING,
                allowNull: false
            },

            symbol: {
                type: DataTypes.STRING,
                allowNull: false
            },
            fx_account_id: {
                type: DataTypes.UUID,
                allowNull: false
            },

            fee_account_id: {
                type: DataTypes.UUID,
                allowNull: false
            },
            fee_invoice_account_id: {
                type: DataTypes.UUID,
                allowNull: false
            },
            fee_wire_account_id: {
                type: DataTypes.UUID,
                allowNull: false
            },
            fee_fx_account_id: {
                type: DataTypes.UUID,
                allowNull: false
            },
            commission_account_id: {
                type: DataTypes.UUID,
                allowNull: false
            }
        },
        {
            tableName: 'currencies',
            instanceMethods: {
                toJSON: function(){
                    var values = this.get();
                    delete values.fx_account_id;
                    delete values.fee_account_id;
                    delete values.fee_invoice_account_id;
                    delete values.fee_wire_account_id;
                    delete values.fee_fx_account_id;
                    return values;
                }
            }
        } );
    return Currency;
};
