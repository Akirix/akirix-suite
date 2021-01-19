import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'signup-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    registrationBinding: 'controllers.application.content',
    needs: [ 'application' ],
    currentDate: (new Date()),

    validations: {
        "first_name": {
            inline: EmberValidations.validator( function(){
                var firstName = this.model.get( 'first_name' );
                var firstNameConfirm = this.model.get( 'controllers.application.content.user.first_name' );

                if( typeof firstName === 'string' ){
                    firstName = firstName.trim();
                }
                if( typeof firstNameConfirm === 'string' ){
                    firstNameConfirm = firstNameConfirm.trim();
                }

                if( Ember.isEmpty( firstName ) || firstName !== firstNameConfirm ){
                    return 'Must be the same as ' + firstNameConfirm;
                }
            } )
        },
        "last_name": {
            inline: EmberValidations.validator( function(){
                var lastName = this.model.get( 'last_name' );
                var lastNameConfirm = this.model.get( 'controllers.application.content.user.last_name' );

                if( typeof lastName === 'string' ){
                    lastName = lastName.trim();
                }
                if( typeof lastNameConfirm === 'string' ){
                    lastNameConfirm = lastNameConfirm.trim();
                }

                if( Ember.isEmpty( lastName ) || lastName !== lastNameConfirm ){
                    return 'Must be the same as ' + lastNameConfirm;
                }
            } )
        },
        "city": {
            presence: true
        },
        "agreement_1": {
            acceptance: {
                message: 'Please accept the agreement'
            }
        },
        "agreement_2": {
            acceptance: {
                message: 'Please accept the agreement'
            }
        }
    },

    actions: {
        submit: function(){
            var _this = this;
            var adapter = _this.get( 'akxAdapter' );
            var registration = _this.get( 'registration' );

            var data = {
                first_name: _this.get( 'first_name' ),
                last_name: _this.get( 'last_name' ),
                city: _this.get( 'city' ),
                postal_code: _this.get( 'postal_code' )
            };

            _this.set( 'formLocked', true );

            _this.validate().then( function(){
                _this.set( 'formLocked', true );

                return adapter.sendRequest( '/registrations/' + registration._id + '/agreement', 'put', data )
                    .then( function( result ){
                        registration.completeStep( 'agreement' );
                        return adapter.sendRequest( '/registrations/' + registration._id + '/appSteps', 'put', { appSteps: registration.appSteps } );
                    } )
                    .then( function(){
                        return adapter.sendRequest( '/registrations/' + registration._id + '/complete', 'put' );
                    } )
                    .then( function( result ){
                        _this.set( 'validated', false );
                        registration.set( 'status', 1 );
                        _this.notify.info( {
                            raw: 'An email has been sent to ' + _this.get( 'session.user.email' ),
                            closeAfter: null
                        } );
                        _this.transitionToRoute( registration.get( 'nextStep' ) );
                    } )
                    .catch( function(){
                        _this.notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                    } );

            }, function(){
            } ).finally( function(){
                _this.set( 'formLocked', false );
            } );
        }
    }
} );
