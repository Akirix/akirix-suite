
module.exports = function( sequelize, DataTypes ){
    var TicketMessage = sequelize.define( 'TicketMessage', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            ticket_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify ticket_id'
                    }
                }
            },

            notes: {
                type: DataTypes.TEXT,
                allowNull: false

            },

            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify user_id'
                    }
                }
            },
        },
        {
            tableName: 'ticket_messages',
            associate: function( models ){
                TicketMessage.belongsTo( models.Ticket );
            }
        } );
    return TicketMessage;
};