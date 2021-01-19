
module.exports = function( sequelize, DataTypes ){
    var User = sequelize.define( 'User',
        {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            email: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    isEmail: true
                }
            },

            first_name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },

            last_name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },

            hash: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },

            company_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },

            phone_mobile: {
                type: DataTypes.STRING,
                allowNull: true
            },

            access: {
                type: DataTypes.TEXT,
                allowNull: true,
                validate: {
                    notEmpty: true
                }
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
            tableName: 'users',
            associate: function( models ){
                User.belongsTo( models.Company )
            },
            instanceMethods: {
                toJSON: function(){
                    var values = this.get();
                    delete values.hash;
                    return values;
                }
            }
        } );

    return User;
};
