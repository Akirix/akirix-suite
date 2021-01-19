module.exports = function( sequelize, DataTypes ){
    var UberSARSubmission = sequelize.define( 'UberSARSubmission', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            uber_sar_report_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify uber_sar_report_id'
                    }
                }
            },

            status: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1, 2, ]
                    ]
                },
                comment: "0: Started, 1: Sent, 2: Confirmed"
            },
            confirmation: {
                allowNull: true,
                type: DataTypes.STRING
            },

            reference: {
                allowNull: true,
                type: DataTypes.STRING
            },


            type: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                },
                comment: "0: FinCEN, 1: goAML"
            }
        },
        {
            tableName: 'uber_sar_submissions',
            associate: function( models ){
                UberSARSubmission.belongsTo( models.UberSARReport );
            },
            classMethods: {}
        } );

    return UberSARSubmission;
};

