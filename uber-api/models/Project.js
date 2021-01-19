
module.exports = function( sequelize, DataTypes ){
    var Project = sequelize.define( 'Project', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
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

            name: {
                type: DataTypes.STRING,
                allowNull: true
            },

            order: {
                type: DataTypes.INTEGER( 5 ).ZEROFILL.UNSIGNED,
                autoIncrement: true,
                allowNull: false,
                unique: true
            },
            invoice_deadline: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            type: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                },
                comment: '0: Tree (Commodity), 1: Linear (VoIP)'
            },
            deterministic: {
                type: DataTypes.INTEGER( 2 ),
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                }
            },
            fixed_profit_margin: {
                type: DataTypes.INTEGER( 2 ),
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                }
            },

            status: {
                type: DataTypes.INTEGER( 2 ),
                defaultValue: 1,
                validate: {
                    isIn: [ [ 0, 1, 2 ] ]
                }
            }
        },
        {
            tableName: 'projects',
            associate: function( models ){
                Project.hasMany( models.Node )
            },
            instanceMethods: {
                toJSON: function(){
                    var values = this.get();
                    delete values.order;
                    return values;
                }
            }
        } );
    return Project;
};
