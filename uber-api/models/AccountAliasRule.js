_ = require( 'lodash' );
var padEnd = require( 'lodash.padend' );
var padStart = require( 'lodash.padstart' );


module.exports = function( sequelize, DataTypes ){

    var AccountAliasRule = sequelize.define( 'AccountAliasRule', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            company_id: {
                type: DataTypes.UUID,
                allowNull: true
            },
            prefix: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify prefix'
                    }
                }
            },
            total_length: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify length'
                    }
                }
            },
            range_min: {
                type: DataTypes.STRING,
                allowNull: true
            },
            range_max: {
                type: DataTypes.STRING,
                allowNull: true
            },
            wire_instruction_id: {
            	type: DataTypes.UUID,
            	allowNull: false 
            },

            type: {
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
            tableName: 'account_alias_rules',
            associate: function( models ){
            },

            instanceMethods: {
                generateAccountAlias: function( company_id, account_id, client_company_id, client_account_id, notes, max_retry ){
                    var self = this;
                    var db = require( '../models' );
                    var AccountAlias = db.AccountAlias;

                    if( max_retry !== 0 ){
                        var acctLength = this.total_length - this.prefix.length;
                        var minVal = 0;
                        var maxVal = Number( padEnd( '', acctLength, '9' ) );
                        if( this.range_min ){
                            minVal = Number( this.range_min.substring( this.prefix.length ) );
                        }

                        if( this.range_max ){
                            maxVal = Number( this.range_max.substring( this.prefix.length ) );
                        }
                        var generatedAccount = this.prefix + padStart( Math.floor( Math.random() * (maxVal - minVal + 1) + minVal ).toString(), acctLength, '0' );

                        return AccountAlias.find( {
                            where: {
                                name: generatedAccount
                            }
                        } ).then( function( accountAlias ){
                            if( !accountAlias ){
                                return AccountAlias.create( {
                                    company_id: company_id,
                                    account_id: account_id,
                                    client_company_id: client_company_id,
                                    client_account_id: client_account_id,
                                    name: generatedAccount,
                                    notes: notes
                                } );
                            }
                            else{
                                return self.generateAccountAlias( company_id, account_id, client_company_id, client_account_id, notes, --max_retry );
                            }
                        } )
                    }
                    else{
                        throw new Error( 'Too many Tries' );
                    }
                }
            }
        } );
    return AccountAliasRule;
};