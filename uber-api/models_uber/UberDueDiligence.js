

module.exports = function( sequelize, DataTypes ){
    var UberDueDiligence = sequelize.define( 'UberDueDiligence',
        {
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
            options: {
                type: DataTypes.STRING,
                allowNull: false
            },

            uber_user_id: {
                type: DataTypes.UUID,
                allowNull: true
            },
            status: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                }
            }

        },
        {
            tableName: 'uber_due_diligence'
        } );

    return UberDueDiligence;
};


