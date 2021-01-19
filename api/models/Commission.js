



module.exports = function( sequelize, DataTypes ){
    var Commission = sequelize.define( 'Commission', {


            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },



            affiliate_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify affiliate_id'
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


            rate: {
                type: DataTypes.DECIMAL( 14, 4 ),
                allowNull: false,
                defaultValue: 0.00,
                validate: {
                    isDecimal: true,
                    min: 0
                }
            },

            start_date: {
                type: DataTypes.DATE,
                allowNull: false,
                validate: {
                    isDate: {
                        msg: 'Must specify a day to start commission'
                    }
                }
            },

            end_date: {
                type: DataTypes.DATE,
                allowNull: false,
                validate: {
                    isDate: {
                        msg: 'Must specify a day to end commission'
                    }
                }
            },

            status: {
                type: DataTypes.INTEGER( 1 ),
                allowNull: false,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                },
                defaultValue: 0
            }
        },
        {
            tableName: 'commissions',
            associate: function( models ){
                Commission.belongsTo( models.Company );
            }
        } );

    return Commission;
};
