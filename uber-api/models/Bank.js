
module.exports = function( sequelize, DataTypes ){
    var Bank = sequelize.define( 'Bank', {

            id: {
                type: DataTypes.STRING,
                primaryKey: true
            },

            office_code: {
                type: DataTypes.STRING,
                allowNull: true
            },

            servicing_FRB_number: {
                type: DataTypes.STRING,
                allowNull: true
            },

            record_type_code: {
                type: DataTypes.STRING,
                allowNull: true

            },

            change_date: {
                type: DataTypes.STRING,
                allowNull: true
            },

            new_routing_number: {
                type: DataTypes.STRING,
                allowNull: true
            },

            name: {
                type: DataTypes.STRING,
                allowNull: false
            },

            address: {
                type: DataTypes.STRING,
                allowNull: true
            },

            city: {
                type: DataTypes.STRING,
                allowNull: true
            },

            state_code: {
                type: DataTypes.STRING,
                allowNull: true
            },

            zip_code: {
                type: DataTypes.STRING,
                allowNull: true
            },

            telephone: {
                type: DataTypes.STRING,
                allowNull: true
            },

            institution_status_code: {
                type: DataTypes.STRING,
                allowNull: true
            },

            data_view_code: {
                type: DataTypes.STRING,
                allowNull: true
            },

            country: {
                type: DataTypes.STRING,
                allowNull: true
            },

            branch: {
                type: DataTypes.STRING,
                allowNull: true
            },
            type: {
                type: DataTypes.STRING,
                allowNull: true
            },

            ach: {
                type: DataTypes.INTEGER( 1 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                }
            },

            wire: {
                type: DataTypes.INTEGER( 1 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                }
            },


        },
        {
            tableName: 'banks'
        } );

    return Bank;
};


