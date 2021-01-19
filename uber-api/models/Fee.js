var _ = require( 'lodash' );
var Promise = require( 'promise' );
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

                getFeeData: function(){
                    return JSON.parse( this.fee_data );
                },

                getLoanRate: function(){
                    return JSON.parse( this.fee_data ).loan;
                },

                getInvoiceInRate: function(){
                    return JSON.parse( this.fee_data ).invoice.in;
                },

                getInvoiceOutRate: function(){
                    return JSON.parse( this.fee_data ).invoice.out;
                },

                getTMInvoiceInRate: function( currency_id, invoiceAmount ){
                    var tmInvoiceFeeTable = JSON.parse( this.fee_data ).tm_invoice;
                    if( tmInvoiceFeeTable.hasOwnProperty( currency_id ) ){
                        tmInvoiceFeeTable = tmInvoiceFeeTable[ currency_id ];
                    }
                    else{
                        tmInvoiceFeeTable = tmInvoiceFeeTable.default;
                    }
                    var tmInvoiceInRate = 0;

                    if( _.isObject( tmInvoiceFeeTable.in ) ){
                        _.forEach( tmInvoiceFeeTable.in, function( value, key ){
                            if( invoiceAmount >= Number( key ) ){
                                tmInvoiceInRate = value;
                            }
                        } );
                    }
                    else{
                        tmInvoiceInRate = tmInvoiceFeeTable.in;
                    }
                    return tmInvoiceInRate;
                },

                getTMInvoiceOutRate: function( currency_id, invoiceAmount ){
                    var tmInvoiceFeeTable = JSON.parse( this.fee_data ).tm_invoice;
                    if( tmInvoiceFeeTable.hasOwnProperty( currency_id ) ){
                        tmInvoiceFeeTable = tmInvoiceFeeTable[ currency_id ];
                    }
                    else{
                        tmInvoiceFeeTable = tmInvoiceFeeTable.default;
                    }
                    var tmInvoiceOutRate = 0;

                    if( _.isObject( tmInvoiceFeeTable.out ) ){
                        _.forEach( tmInvoiceFeeTable.out, function( value, key ){
                            if( invoiceAmount >= Number( key ) ){
                                tmInvoiceOutRate = value;
                            }
                        } );
                    }
                    else{
                        tmInvoiceOutRate = tmInvoiceFeeTable.out;
                    }
                    return tmInvoiceOutRate;
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

                },

                validateFee: function( feeData ){
                    return new Promise( function( resolve, reject ){
                        var wireFeeTable = JSON.parse( feeData );
                        var fees = [ 'invoice', 'loan', 'book_transfer', 'wire', 'fx' ];
                        var defaultValues = [ 'speedwire', 'in_ach', 'out_ach', 'in_wire', 'out_wire', 'in_percent', 'out_percent' ];
                        var errors = [];

                        _.forEach( fees, function( fee ){
                            if( !wireFeeTable.hasOwnProperty( fee ) ){
                                errors.push( 'Missing ' + fee + ' in fee table' );
                            }
                            else if( typeof wireFeeTable[ fee ] !== 'object' ){
                                if( !_.isNumber( wireFeeTable[ fee ] ) ){
                                    errors.push( fee + ' Value must be numbers' );
                                }
                            }
                        } );

                        // Deep check wire fee


                        if( !wireFeeTable.wire.hasOwnProperty( 'default' ) ){
                            errors.push( 'Wire must have a default value' );
                        }

                        for( var property in wireFeeTable.wire ){

                            if( wireFeeTable.wire.hasOwnProperty( property ) ){
                                if( !wireFeeTable.wire[ property ].hasOwnProperty( 'default' ) ){
                                    errors.push( 'Wire ' + property + ' must have a default value' );
                                }
                                for( var nestedProp in wireFeeTable.wire[ property ] ){
                                    _.forEach( defaultValues, function( val ){
                                        if( wireFeeTable.wire[ property ].hasOwnProperty( nestedProp ) ){
                                            if( !wireFeeTable.wire[ property ][ nestedProp ].hasOwnProperty( val ) ){
                                                errors.push( 'Wire ' + property + ' ' + nestedProp + ' must have ' + val );
                                            }
                                            else if( typeof wireFeeTable.wire[ property ][ nestedProp ][ val ] !== 'object' ){
                                                if( !_.isNumber( wireFeeTable.wire[ property ][ nestedProp ][ val ] ) ){
                                                    errors.push( 'Wire ' + property + ' ' + nestedProp + ' ' + val + ' Value must be a number' );
                                                }
                                            }
                                            else{
                                                for( var deepNested in  wireFeeTable.wire[ property ][ nestedProp ][ val ] ){
                                                    if( wireFeeTable.wire[ property ][ nestedProp ][ val ].hasOwnProperty( deepNested ) ){
                                                        if( !_.isNumber( wireFeeTable.wire[ property ][ nestedProp ][ val ][ deepNested ] ) ){
                                                            errors.push( 'Wire ' + property + ' ' + nestedProp + ' ' + val + deepNested + ' Value must be a number' );
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    } );
                                }
                            }
                        }

                        if( _.isEmpty( errors ) ){
                            resolve();
                        }
                        else{
                            reject( errors );
                        }
                    } );
                }
            }
        } );
    return Fee;
};