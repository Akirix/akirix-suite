

module.exports = function( sequelize, DataTypes ){
    var UberVerification = sequelize.define( 'UberVerification', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            uber_user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify uber_user_id'
                    }
                }
            },
            uber_token_id: {
                type: DataTypes.UUID,
                allowNull: true
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
                        [ 0, 1, 2, 3 ]
                    ]
                },
                comment: '0: 2 factor, 1: password reset, 2: Voxloc Enrollment, 3: Voxloc Verification '
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
            tableName: 'uber_verifications',
            associate: function( models ){
                UberVerification.belongsTo( models.UberUser );
            }
        } );

    return UberVerification;
};
