module.exports = function( sequelize, DataTypes ){
    var UberSARReportRelation = sequelize.define( 'UberSARReportRelation', {
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


            uber_sar_report_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify uber_sar_report_id'
                    }
                }
            }


        },
        {
            tableName: 'uber_sar_report_relations',
            associate: function( models ){
                UberSARReportRelation.belongsTo( models.UberSARReport );
                //UberSARReportRelation.belongsTo( models.Company );
            }
        } );

    return UberSARReportRelation;
};
