
module.exports = function( sequelize, DataTypes ){
    var UberTag = sequelize.define( 'UberTag', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must provide name to tag'
                    }
                }
            }
        },
        {
            tableName: 'uber_tags',
            associate: function( models ){
                UberTag.hasMany( models.UberTagAssociation );
            }
        } );
    return UberTag;
};