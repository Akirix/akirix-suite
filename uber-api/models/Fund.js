

module.exports = function( sequelize, DataTypes ){
    var Fund = sequelize.define( 'Fund', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            company_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify company_id'
                    }
                }
            },
            investor_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify investor_id'
                    }
                }
            },
            account_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify account_id'
                    }
                }
            },
            currency_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify currency_id'
                    }
                }
            },
            amount: {
                type: DataTypes.DECIMAL( 14, 2 ),
                allowNull: false,
                defaultValue: '0.00'
            },
            rate: {
                type: DataTypes.DECIMAL( 14, 8 ),
                allowNull: false,
                defaultValue: 0.00,
                validate: {
                    isDecimal: true,
                    min: 0
                }
            },
            end_date: {
                type: DataTypes.DATE,
                allowNull: false,
                validate: {
                    isDate: {
                        msg: 'Must specify loan end date'
                    }
                }
            },
            nickname: {
                type: DataTypes.STRING,
                allowNull: true
            },
            name: {
                type: DataTypes.INTEGER( 5 ).ZEROFILL.UNSIGNED,
                autoIncrement: true,
                allowNull: false,
                unique: true,
                set: function( v ){
                    if( !this.selectedValues.hasOwnProperty( 'name' ) ){
                        return this.setDataValue( 'name', v );
                    }
                    else{
                        delete this.selectedValues.name;
                    }
                }
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            status: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1, 2, 3 ]
                    ]
                }
            }
        },
        {
            tableName: 'funds',
            associate: function( models ){
                Fund.belongsTo( models.Company, {
                    as: 'Investor',
                    foreignKey: 'investor_id'
                } );
                Fund.belongsTo( models.Company );
                Fund.hasMany( models.Node );
            }
        } );
    return Fund;
}
