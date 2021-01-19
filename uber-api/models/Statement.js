
module.exports = function( sequelize, DataTypes ){
    var Statement = sequelize.define( 'Statement', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
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

            year: {
                type: DataTypes.INTEGER( 4 ),
                allowNull: false
            },

            month: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false
            },
            s3_uri: {
                type: DataTypes.STRING,
                allowNull: true
            }
        },
        {
            tableName: 'statements',
            associate: function( models ){
                Statement.belongsTo( models.Company );
                Statement.belongsTo( models.Account );
            }
        } );
    return Statement;
};
