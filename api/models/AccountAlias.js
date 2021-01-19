
module.exports = function( sequelize, DataTypes ){

    var AccountAlias = sequelize.define( 'AccountAlias', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            account_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify account id'
                    }
                }
            },

            company_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify company id'
                    }
                }
            },

            wire_instruction_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify wire instructions id'
                    }
                }
            },
            model: {
                type: DataTypes.STRING,
                allowNull: true
            },

            model_id: {
                type: DataTypes.UUID,
                allowNull: true
            },

            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: {
                        msg: 'Must specify name'
                    }
                }
            },

            iban: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true,
                validate: {
                    notEmpty: {
                        msg: 'Must specify name'
                    }
                }
            },

            notes: {
                type: DataTypes.TEXT,
                allowNull: true
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
            }
        },
        {
            tableName: 'account_aliases',
            associate: function( models ){
                AccountAlias.belongsTo( models.Account );
                AccountAlias.belongsTo( models.Company );
            },
            instanceMethods: {
                toJSON: function(){
                    var resp = this.get();
                    delete resp.notes;
                    return resp;
                }
            }
        } );
    return AccountAlias;
};