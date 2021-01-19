
module.exports = function( sequelize, DataTypes ){
    var Location = sequelize.define( 'Location', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            name: {
                type: DataTypes.STRING,
                allowNull: false
            },

            abbreviation: {
                type: DataTypes.STRING,
                allowNull: false
            },

            type: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1, 2 ]
                    ]
                },
                comment: '0: Country, 1: State, 2: City'
            },
        },
        {
            tableName: 'locations',
        } );
    return Location;
};
