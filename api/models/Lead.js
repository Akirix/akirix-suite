
module.exports = function( sequelize, DataTypes ){
    var Lead = sequelize.define( 'Lead', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            user_id: {
                type: DataTypes.UUID,
                allowNull: true
            },

            name: {
                type: DataTypes.STRING,
                allowNull: true
            },

            company_name: {
                type: DataTypes.STRING,
                allowNull: true
            },

            email: {
                type: DataTypes.STRING,
                allowNull: true
            }
        },
        {
            tableName: 'leads'
        } );

    return Lead;
};
