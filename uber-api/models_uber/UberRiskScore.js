module.exports = function( sequelize, DataTypes ){
    var UberRiskScore = sequelize.define( 'UberRiskScore', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            score: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
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
            date_of_score: {
                type: DataTypes.DATE,
                allowNull: true
            }

        },
        {
            tableName: 'uber_risk_scores'
        } );
    return UberRiskScore;
};
