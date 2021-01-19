

module.exports = function( sequelize, DataTypes ){
    var Transaction = sequelize.define( 'Transaction', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            order: {
                type: DataTypes.INTEGER().UNSIGNED.ZEROFILL,
                autoIncrement: true,
                allowNull: false,
                unique: true,
                set: function( v ){
                    if( !this.selectedValues.hasOwnProperty( 'order' ) ){
                        return this.setDataValue( 'order', v );
                    }
                    else{
                        delete this.selectedValues.order;
                    }
                }
            },
            currency_id: {
                type: DataTypes.STRING( 3 ),
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify currency_id'
                    }
                }
            },
            from_account_id: {
                type: DataTypes.UUID,
                allowNull: true
            },
            to_account_id: {
                type: DataTypes.UUID,
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
            parent_id: {
                type: DataTypes.UUID,
                allowNull: true
            },
            amount: {
                type: DataTypes.DECIMAL( 14, 2 ),
                allowNull: false,
                defaultValue: 0.00,
                validate: {
                    isDecimal: true,
                    min: 0
                }
            },
            type: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 1, 2, 3, 4, 5, 6, 8, 9 ]
                    ]
                }
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
            tableName: 'transactions',
            associate: function( models ){
                Transaction.belongsTo( models.Account, {
                    as: 'fromAccount', foreignKey: 'from_account_id', through: null
                } );
                Transaction.belongsTo( models.Account, {
                    as: 'toAccount', foreignKey: 'to_account_id', through: null
                } );
            }
        } );
    return Transaction;
};
