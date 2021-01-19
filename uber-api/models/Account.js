
var math = require( 'mathjs' );
var Promise = require( 'promise' );

module.exports = function( sequelize, DataTypes ){
    var Account = sequelize.define( 'Account', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            currency_id: {
                type: DataTypes.STRING( 3 ),
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify currency_id'
                    }
                }
            },

            company_id: {
                type: DataTypes.UUID,
                allowNull: true,
                validate: {
                    notEmpty: {
                        msg: 'Must specify company_id'
                    }
                }
            },

            fund_id: {
                type: DataTypes.UUID,
                allowNull: true
            },

            name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },

            balance: {
                type: DataTypes.DECIMAL( 14, 2 ),
                allowNull: false,
                defaultValue: 0.00,
                validate: {
                    isDecimal: true,
                    min: 0
                }
            },

            balance_hold: {
                type: DataTypes.DECIMAL( 14, 2 ),
                allowNull: false,
                defaultValue: 0.00,
                validate: {
                    isDecimal: true,
                    min: 0
                }
            },

            type: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                },
                comment: '0: Regular cash account, 1: Loan/Investment account'
            }
        },
        {
            tableName: 'accounts',
            associate: function( models ){
                Account.belongsTo( models.Company );
                Account.belongsTo( models.Currency );
                Account.belongsTo( models.Fund );
            },

            instanceMethods: {
                balanceAdd: function( amount, t ){
                    return new Promise( function( resolve, reject ){
                        this.Model.update(
                            {
                                balance: math.round( this.balance + amount, 2 )
                            },
                            {
                                id: this.id,
                                balance: this.balance
                            },
                            { transaction: t }
                        ).spread( function( affectedCount ){
                            if( affectedCount === 1 ){
                                resolve();
                            }
                            else{
                                reject( new Error( 'Failed to update account balance' ) );
                            }
                        } ).catch( function( err ){
                            reject( err );
                        } );
                    }.bind( this ) );
                },

                balanceSub: function( amount, t ){
                    return new Promise( function( resolve, reject ){
                        this.Model.update(
                            {
                                balance: math.round( this.balance - amount, 2 )
                            },
                            {
                                id: this.id,
                                balance: this.balance
                            },
                            { transaction: t }
                        ).spread( function( affectedCount ){
                            if( affectedCount === 1 ){
                                resolve();
                            }
                            else{
                                reject( new Error( 'Failed to update account balance' ) );
                            }
                        } ).catch( function( err ){
                            reject( err );
                        } );
                    }.bind( this ) );
                }
            }
        } );
    return Account;
};
