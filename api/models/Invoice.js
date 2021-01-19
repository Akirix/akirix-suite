
module.exports = function( sequelize, DataTypes ){
    var Invoice = sequelize.define( 'Invoice', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            invoice_date: {
                type: DataTypes.DATE,
                allowNull: true,
                validate: {
                    isDate: true
                }
            },


            invoice_period_from: {
                type: DataTypes.DATE,
                allowNull: true,
                validate: {
                    isDate: true
                }
            },

            invoice_period_to: {
                type: DataTypes.DATE,
                allowNull: true,
                validate: {
                    isDate: true
                }
            },

            name: {
                type: DataTypes.STRING,
                allowNull: true
            },

            title: {
                type: DataTypes.STRING,
                allowNull: true
            },

            to_company_name: {
                type: DataTypes.STRING,
                allowNull: true
            },

            to_company_email: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    isEmail: true
                }
            },

            to_company_phone: {
                type: DataTypes.STRING,
                allowNull: true
            },

            to_company_address: {
                type: DataTypes.STRING,
                allowNull: true
            },

            to_company_city: {
                type: DataTypes.STRING,
                allowNull: true
            },

            to_company_state_province: {
                type: DataTypes.STRING,
                allowNull: true
            },

            to_company_postal_code: {
                type: DataTypes.STRING,
                allowNull: true
            },

            to_company_country: {
                type: DataTypes.STRING,
                allowNull: true
            },

            order: {
                type: DataTypes.INTEGER( 5 ).UNSIGNED.ZEROFILL,
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

            parent_id: {
                type: DataTypes.UUID,
                allowNull: true
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

            to_company_id: {
                type: DataTypes.UUID,
                allowNull: true
            },

            node_id: {
                type: DataTypes.UUID,
                allowNull: true
            },

            project_id: {
                type: DataTypes.UUID,
                allowNull: true
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

            account_id: {
                type: DataTypes.UUID,
                allowNull: true
            },

            notes: {
                type: DataTypes.TEXT,
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

            remaining_amount: {
                type: DataTypes.DECIMAL( 14, 2 ),
                allowNull: false,
                defaultValue: 0.00,
                validate: {
                    isDecimal: true,
                    min: 0
                }
            },

            tax_rate: {
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
                        [ 0, 1, 2 ]
                    ]
                }
            },

            status: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1, 2, 3, 4 ]
                    ]
                }
            }
        },
        {
            tableName: 'invoices',
            associate: function( models ){
                Invoice.belongsTo( models.Project );
                Invoice.belongsTo( models.Currency );
                Invoice.belongsTo( models.Company );
                Invoice.belongsTo( models.Company, {
                    as: 'toCompany', foreignKey: 'to_company_id', through: null
                } );
                Invoice.belongsTo( models.Node );
                Invoice.hasMany( models.InvoiceItem );
            }
        } );
    return Invoice;
};
