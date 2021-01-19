
module.exports = function( sequelize, DataTypes ){
    var UberTagAssociation = sequelize.define( 'UberTagAssociation', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            uber_tag_id: {
                type: DataTypes.UUID,
                allowNull: false
            },

            model_id: {
                type: DataTypes.UUID,
                allowNull: false
            },

            model: {
                type: DataTypes.STRING,
                allowNull: false
            }
        },
        {
            tableName: 'uber_tag_associations',
            associate: function( models ){
                UberTagAssociation.belongsTo( models.UberTag );
            }
        } );
    return UberTagAssociation;
};