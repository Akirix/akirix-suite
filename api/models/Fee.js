var _ = require( 'lodash' );
var math = require( 'mathjs' );

module.exports = function( sequelize, DataTypes ){
    var Fee = sequelize.define( 'Fee', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            company_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },

            fee_data: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            }
        },
        {
            tableName: 'fees',
            associate: function( models ){
                Fee.belongsTo( models.Company );
            },
            instanceMethods: {
                getLoanRate: function(){
                    return JSON.parse( this.fee_data ).loan;
                },

                getInvoiceInRate: function(){
                    return JSON.parse( this.fee_data ).invoice.in;
                },

                getInvoiceOutRate: function(){
                    return JSON.parse( this.fee_data ).invoice.out;
                },

                getPreferredAccountRate: function(){
                    return JSON.parse( this.fee_data ).preferred_account;
                },

                getMembershipRate: function(){
                    return JSON.parse( this.fee_data ).membership;
                },

                getBookTransferRate: function(){
                    return JSON.parse( this.fee_data ).book_transfer;
                },

                getFxRates: function(){
                    return JSON.parse( this.fee_data ).fx;
                },

                getWireFee: function( wire ){
                    var wireFeeTable = JSON.parse( this.fee_data ).wire[ wire.currency_id ];
                    if( wireFeeTable.hasOwnProperty( wire.bank_country ) ){
                        wireFeeTable = wireFeeTable[ wire.bank_country ];
                    }
                    else{
                        wireFeeTable = wireFeeTable.default;
                    }

                    var wireFee = 0;
                    var wirePercentFee = 0;

                    // Out
                    if( wire.type === 0 ){
                        if( wire.method === 0 ){
                            if( _.isObject( wireFeeTable.out_wire ) ){
                                _.forEach( wireFeeTable.out_wire, function( value, key ){
                                    if( wire.amount >= Number( key ) ){
                                        wireFee = value;
                                    }
                                } );
                            }
                            else{
                                wireFee = wireFeeTable.out_wire;
                            }
                        }
                        else if( wire.method === 1 ){
                            wireFee = wireFeeTable.out_ach;
                        }

                        if( _.isObject( wireFeeTable.out_percent ) ){
                            _.forEach( wireFeeTable.out_percent, function( value, key ){
                                if( wire.amount >= Number( key ) ){
                                    wirePercentFee = math.round( wire.amount * value, 2 );
                                }
                            } );
                        }
                        else{
                            wirePercentFee = math.round( wire.amount * wireFeeTable.out_percent, 2 );
                        }

                        if( wire.speedwire ){
                            wireFee += wireFeeTable.speedwire;
                        }
                    }
                    // Inbound
                    else if( wire.type === 1 ){
                        if( wire.method === 0 ){
                            if( _.isObject( wireFeeTable.in_wire ) ){
                                _.forEach( wireFeeTable.in_wire, function( value, key ){
                                    if( wire.amount >= Number( key ) ){
                                        wireFee = value;
                                    }
                                } );
                            }
                            else{
                                wireFee = wireFeeTable.in_wire;
                            }
                        }
                        else if( wire.method === 1 ){
                            wireFee = wireFeeTable.in_ach;
                        }

                        if( _.isObject( wireFeeTable.in_percent ) ){
                            _.forEach( wireFeeTable.in_percent, function( value, key ){
                                if( wire.amount >= Number( key ) ){
                                    wirePercentFee = math.round( wire.amount * value, 2 );
                                }
                            } );
                        }
                        else{
                            wirePercentFee = math.round( wire.amount * wireFeeTable.in_percent, 2 );
                        }
                    }
                    if( wire.type === 0 && wireFeeTable.hasOwnProperty( 'out_max' ) ){
                        return Math.min( math.round( wireFee + wirePercentFee, 2 ), wireFeeTable.out_max );
                    }
                    else if( wire.type === 1 && wireFeeTable.hasOwnProperty( 'in_max' ) ){
                        return Math.min( math.round( wireFee + wirePercentFee, 2 ), wireFeeTable.in_max );
                    }
                    else{
                        return math.round( wireFee + wirePercentFee, 2 );
                    }
                }

            }
        } );
    return Fee;
};