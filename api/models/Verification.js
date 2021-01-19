
module.exports = function( sequelize, DataTypes ){
    var Verification = sequelize.define( 'Verification', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify user_id'
                    }
                }
            },

            verify: {
                type: DataTypes.STRING,
                allowNull: true
            },

            code: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    notEmpty: true
                }
            },

            type: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                },
                comment: '0: 2 factor, 1: password reset'
            },

            expires: {
                type: DataTypes.DATE,
                allowNull: false,
                validate: {
                    isDate: true
                }
            },

            status: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                },
                defaultValue: 0,
                comment: '0: New, 1: Active'
            }
        },
        {
            tableName: 'verifications',
            associate: function( models ){
                Verification.belongsTo( models.User );
            }
        } );

    return Verification;
};
