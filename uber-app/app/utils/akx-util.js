import Ember from 'ember';
import Notify from 'ember-notify';
import config from 'uber-app/config/environment';
import _ from 'lodash/lodash';

export default Ember.Object.extend( {
    _displayErrors: function( xhr, options ){
        var response;
        if( !Ember.isEmpty( xhr.responseText ) ){
            try{
                response = JSON.parse( xhr.responseText );
            }
            catch( e ){
            }
        }

        if( typeof response === 'object' && typeof response.errors === 'object' && options.hasOwnProperty( 'scope' ) ){
            var errors = {};
            var generalErrors = '';
            var notify = false;

            // Handle validation errors
            if( typeof response.errors === 'object' ){

                response.errors.forEach( function( item, key ){
                    var type = typeof item;

                    if( type === 'object' ){
                        for( var param in item ){
                            if( Array.isArray( errors[ param ] ) ){
                                errors[ param ] = errors[ param ].concat( item[ param ] );
                            }
                            else{
                                errors[ param ] = item[ param ];
                            }
                        }
                    }
                    else if( type === 'string' ){
                        notify = true;

                        if( key !== 0 ){
                            generalErrors += '<br>';
                        }
                        generalErrors += item;
                    }
                } );
            }

            if( !Ember.isEmpty( errors ) ){
                options.scope.set( 'validated', true );
            }

            // Set errors
            for( var param in errors ){
                var currentErrors = options.scope.get( 'errors.' + param );

                if( Array.isArray( currentErrors ) ){
                    currentErrors = currentErrors.concat( errors[ param ] );
                    currentErrors = currentErrors.uniq();
                }
                else{
                    currentErrors = errors[ param ];
                }

                options.scope.set( 'errors.' + param, currentErrors );
                options.scope.propertyDidChange( 'errors.' + param );
            }

            // Handle General Notifications
            if( notify ){
                if( typeof options.closeAfter !== 'number' && options.closeAfter !== null ){
                    options.closeAfter = 5000;
                }

                if( options.sticky === true ){
                    options.closeAfter = null;
                }

                if( Ember.isEmpty( options.level ) ){
                    options.level = 'warning';
                }

                var validOptions = [ 'info', 'alert', 'success', 'warning' ];
                if( validOptions.indexOf( options.level ) !== -1 ){
                    Notify[ options.level ]( {
                        raw: generalErrors,
                        closeAfter: options.closeAfter
                    } );
                }
                else{
                    Notify.warning( {
                        raw: generalErrors,
                        closeAfter: options.closeAfter
                    } );
                }
            }
        }
    },
    _endSession: function( xhr, options ){
        if( typeof options.scope !== 'undefined' ){
            this.send( 'invalidateSession' );
        }
    },
    _showLockedOverlay: function( xhr, options ){
        if( typeof options.scope !== 'undefined' ){

            var type = options.scope.get( 'type' );

            var applicationRoute;
            var applicationController;

            if( type === 'route' ){
                applicationController = options.scope.controllerFor( 'application' );
                applicationRoute = options.scope.applicationController.get( 'target' );
            }
            else if( type === 'controller' ){

                var controllerNeeds = options.scope.get( 'needs' );
                if( Array.isArray( options.scope.get( 'needs' ) ) && controllerNeeds.isAny( 'application' ) ){
                    applicationController = options.scope.get( 'controllers.application' );
                    applicationRoute = options.scope.get( 'controllers.application.target' );
                }
                else{
                    applicationController = options.scope;
                    applicationRoute = options.scope.get( 'target' );
                }
            }

            if( typeof applicationRoute !== 'undefined' ){
                if( typeof xhr.responseJSON === 'object' && typeof xhr.responseJSON.message === 'string' ){
                    applicationController.set( 'modal', {
                        message: xhr.responseJSON.message
                    } );
                }

                applicationRoute.send( 'openModal', { template: 'locked' } );
            }
        }
    },
    _showTwoFactorOverlay: function( xhr, options ){
        if( typeof options.scope !== 'undefined' ){
            var applicationRoute = options.scope.get( 'target' );
            if( applicationRoute ){
                applicationRoute.send( 'showTwoFactorOverlay' );
            }
        }
    },
    _sendRequest: function( endpoint, type, data, options ){
        return new Ember.RSVP.Promise( function( resolve, reject ){

            var settings = {
                url: config.APP.uber_api_host + endpoint,
                cache: false,
                dataType: 'json',
                type: type,
                contentType: 'application/json; charset=utf-8',
                success: function _sendRequestSuccess( data, textStatus, jqXHR ){
                    resolve( { data: data, textStatus: textStatus, jqXHR: jqXHR } );
                },
                error: function _sendRequestError( jqXHR, textStatus, errorThrown ){
                    reject( { jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown } );
                }
            };

            if( type !== 'get' && type !== 'delete' && !Ember.isEmpty( data ) ){
//                if( typeof data.getJSON !== 'undefined' ){
//                    settings['data'] = JSON.stringify( data.getJSON() );
//                }
//                else{
//                }
                settings[ 'data' ] = JSON.stringify( data );
            }

            Ember.$.ajax( settings );

        } );
    },
    _showRateLimitOverlay: function( xhr, options ){
        if( typeof options.scope !== 'undefined' ){
            var type = options.scope.get( 'type' );
            var applicationRoute;
            if( type === 'route' ){
                applicationRoute = options.scope.controllerFor( 'application' ).get( 'target' );
            }
            else if( type === 'controller' ){
                var controllerNeeds = options.scope.get( 'needs' );
                if( Array.isArray( options.scope.get( 'needs' ) ) && controllerNeeds.isAny( 'application' ) ){
                    applicationRoute = options.scope.get( 'controllers.application.target' );
                }
                else{
                    applicationRoute = options.scope.get( 'target' );
                }
            }

            if( typeof applicationRoute !== 'undefined' ){
                applicationRoute.send( 'showRateLimitOverlay' );
            }
        }
    },
    _showPasswordExpired: function( xhr, options ){
        if( typeof options.scope !== 'undefined' ){
            var type = options.scope.get( 'type' );
            var applicationRoute;
            if( type === 'route' ){
                applicationRoute = options.scope.controllerFor( 'application' ).get( 'target' );
            }
            else if( type === 'controller' ){
                var controllerNeeds = options.scope.get( 'needs' );
                if( Array.isArray( options.scope.get( 'needs' ) ) && controllerNeeds.isAny( 'application' ) ){
                    applicationRoute = options.scope.get( 'controllers.application.target' );
                }
                else{
                    applicationRoute = options.scope.get( 'target' );
                }
            }

            if( typeof applicationRoute !== 'undefined' ){
                applicationRoute.send( 'showPasswordExpired' );
            }
        }
    },
    _showDupCheckOverlay: function( xhr, options ){
        if( typeof options.scope !== 'undefined' ){
            var applicationRoute = options.scope.get( 'target' );
            if( applicationRoute ){
                applicationRoute.send( 'showDupCheckOverlay' );
            }
        }
    },

    handleError: function( xhr, options ){
        var self = this;

        if( !Ember.isEmpty( xhr ) ){
            if( xhr.status === 400 ){
                options.sticky = true;
                self._displayErrors( xhr, options );
            }
            else if( xhr.status === 401 ){
                self._endSession( xhr, options );
            }
            else if( xhr.status === 409 ){
                self._showDupCheckOverlay( xhr, options );
            }
            else if( xhr.status === 420 ){
                self._showTwoFactorOverlay( xhr, options );
            }
            //else if( xhr.status === 421 ){
            //    self._showLockedOverlay( xhr, options );
            //}
            else if( xhr.status === 429 ){
                self._showRateLimitOverlay( xhr, options );
            }
            else if( xhr.status === 498 ){
                self._showPasswordExpired( xhr, options );
            }
            else{
                self._displayErrors( xhr, options );
            }
        }
    },

    getWireFee: function( feeObj, wire ){
        var wireFeeTable = JSON.parse( feeObj.get( 'fee_data' ) ).wire[ Ember.get( wire, 'currency_id' ) ];
        if( wireFeeTable.hasOwnProperty( Ember.get( wire, 'bank_country' ) ) ){
            wireFeeTable = wireFeeTable[ Ember.get( wire, 'bank_country' ) ];
        }
        else{
            wireFeeTable = wireFeeTable.default;
        }

        var wireFee = 0;
        var wirePercentFee = 0;

        // Out
        if( Ember.get( wire, 'type' ) === 0 ){
            if( Ember.get( wire, 'method' ) === 0 ){
                if( _.isObject( wireFeeTable.out_wire ) ){
                    _.forEach( wireFeeTable.out_wire, function( value, key ){
                        if( Ember.get( wire, 'amount' ) >= Number( key ) ){
                            wireFee = value;
                        }
                    } );
                }
                else{
                    wireFee = wireFeeTable.out_wire;
                }
            }
            else if( Ember.get( wire, 'method' ) === 1 ){
                wireFee = wireFeeTable.out_ach;
            }


            if( _.isObject( wireFeeTable.out_percent ) ){
                _.forEach( wireFeeTable.out_percent, function( value, key ){
                    if( Ember.get( wire, 'amount' ) >= Number( key ) ){
                        wirePercentFee = math.round( Ember.get( wire, 'amount' ) * value, 2 );
                    }
                } );
            }
            else{
                wirePercentFee = math.round( Ember.get( wire, 'amount' ) * wireFeeTable.out_percent, 2 );
            }

            if( Ember.get( wire, 'speedwire' ) ){
                wireFee += wireFeeTable.speedwire;
            }
        }
        // Inbound
        else if( Ember.get( wire, 'type' ) === 1 ){
            if( Ember.get( wire, 'method' ) === 0 ){
                if( _.isObject( wireFeeTable.in_wire ) ){
                    _.forEach( wireFeeTable.in_wire, function( value, key ){
                        if( Ember.get( wire, 'amount' ) >= Number( key ) ){
                            wireFee = value;
                        }
                    } );
                }
                else{
                    wireFee = wireFeeTable.in_wire;
                }
            }
            else if( Ember.get( wire, 'method' ) === 1 ){
                wireFee = wireFeeTable.in_ach;
            }

            if( _.isObject( wireFeeTable.in_percent ) ){
                _.forEach( wireFeeTable.in_percent, function( value, key ){
                    if( Ember.get( wire, 'amount' ) >= Number( key ) ){
                        wirePercentFee = math.round( Ember.get( wire, 'amount' ) * value, 2 );
                    }
                } );
            }
            else{
                wirePercentFee = math.round( Ember.get( wire, 'amount' ) * wireFeeTable.in_percent, 2 );
            }
        }

        if( Ember.get( wire, 'type' ) === 0 && wireFeeTable.hasOwnProperty( 'out_max' ) ){
            return Math.min( math.round( wireFee + wirePercentFee, 2 ), wireFeeTable.out_max );
        }
        else if( Ember.get( wire, 'type' ) === 1 && wireFeeTable.hasOwnProperty( 'in_max' ) ){
            return Math.min( math.round( wireFee + wirePercentFee, 2 ), wireFeeTable.in_max );
        }
        else{
            return math.round( wireFee + wirePercentFee, 2 );
        }
    }
} );
