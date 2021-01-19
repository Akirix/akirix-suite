
module.exports = function( sequelize, DataTypes ){
    var Node = sequelize.define( 'Node', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            parent_id: {
                type: DataTypes.UUID,
                allowNull: true
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

            company_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify company_id'
                    }
                }
            },

            fund_id: {
                type: DataTypes.UUID,
                allowNull: true
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

            points: {
                type: DataTypes.DECIMAL( 14, 2 ),
                allowNull: false,
                defaultValue: 0.00,
                validate: {
                    isDecimal: true,
                    min: 0
                }
            },
            discount_rate: {
                type: DataTypes.DECIMAL( 14, 2 ),
                allowNull: true
            },

            points_guarantee: {
                type: DataTypes.DECIMAL( 14, 2 ),
                allowNull: false,
                defaultValue: 0.00,
                validate: {
                    isDecimal: true,
                    min: 0
                }
            },

            points_cash: {
                type: DataTypes.DECIMAL( 14, 2 ),
                allowNull: false,
                defaultValue: 0.00,
                validate: {
                    isDecimal: true,
                    min: 0
                }
            },

            fee_counter: {
                type: DataTypes.DECIMAL( 14, 2 ),
                allowNull: false,
                defaultValue: 0.00,
                validate: {
                    isDecimal: true,
                    min: 0
                }
            },

            name: {
                type: DataTypes.STRING,
                allowNull: true
            },

            notes: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            allow_funding: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                defaultValue: 0
            },

            status: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                validate: {
                    isIn: [
                        [ 0, 1, 2, 3, 4 ]
                    ]
                },
                defaultValue: 0
            }
        },
        {
            tableName: 'nodes',
            associate: function( models ){
                Node.belongsTo( models.Account );
                Node.belongsTo( models.Project );
                Node.belongsTo( models.Company );
                Node.belongsTo( models.Fund );
                Node.belongsTo( models.Node, {
                    as: 'bnode', foreignKey: 'parent_id', through: null
                } );
                Node.hasMany( models.Node, {
                    as: 'snodes', foreignKey: 'parent_id', through: null
                } );
                Node.hasMany( models.Invoice );
                Node.hasMany( models.NodeItem );
                Node.hasMany( models.Amendment );
            },
            instanceMethods: {
                toJSON: function(){
                    var values = this.get();
                    delete values.fee_counter;
                    return values;
                }
            }
        } );

    return Node;
};
