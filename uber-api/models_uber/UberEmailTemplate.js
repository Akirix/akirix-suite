
module.exports = function( sequelize, DataTypes ){
    var UberEmailTemplate = sequelize.define( 'UberEmailTemplate', {

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
                        msg: 'Must Provide A Name For Email Template'
                    }
                }
            },

            email: {
                type: DataTypes.STRING,
                allowNull: true
            },

            subject: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must Provide A Subject For Email Template'
                    }
                }
            },

            content: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must Provide Content For Email Template'
                    }
                }
            },

            model: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: null
            }
        },
        {
            tableName: 'uber_email_templates'
        } );
    return UberEmailTemplate;
};