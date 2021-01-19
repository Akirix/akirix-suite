
module.exports = function( sequelize, DataTypes ){
    var Ticket = sequelize.define( 'Ticket', {

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
                        msg: 'Must specify currency_id'
                    }
                }
            },

            name: {
                type: DataTypes.STRING,
                allowNull: false
            },

            status: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                }
            },

            title: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must provide title'
                    }
                }
            },

            uber_user_id: {
                type: DataTypes.UUID,
                allowNull: true
            },

            priority: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allouwNull: true,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1, 2 ]
                    ]
                }
            }
        },
        {
            tableName: 'tickets',
            associate: function( models ){
                Ticket.belongsTo( models.Company );
                Ticket.hasMany( models.TicketMessage );
            }
        } );
    return Ticket;
};