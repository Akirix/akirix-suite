
module.exports = function( sequelize, DataTypes ){
    var Ticket = sequelize.define( 'Ticket', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            name: {
                type: DataTypes.STRING,
                allowNull: false
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
            }
        },
        {
            tableName: 'tickets',
            associate: function( models ){
                Ticket.belongsTo( models.Company );
                Ticket.hasMany( models.TicketMessage );
            },
            instanceMethods: {
                toJSON: function () {
                    var resp = this.get();
                    delete resp.priority;
                    delete resp.uber_user_id;
                    return resp;
                }
            }
        } );
    return Ticket;
};