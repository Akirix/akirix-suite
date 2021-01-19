import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'signup-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    validations: {
        "email": {
            email: {
                allowBlank: false
            },
            presence: {
                message: 'Please enter a valid email'
            },
            confirmation: {
                message: 'Please enter your email again'
            }
        },
        "password": {
            strongPassword: false,

            confirmation: {
                message: 'Please enter the same password again'
            },
            presence: {
                message: 'Please enter a password'
            }
        }
    },

    actions: {
        signUp: function(){
            var _this = this;
            this.validate().then( function(){
                var data = {
                    email: _this.get( 'email' ).toLowerCase().trim(),
                    password: _this.get( 'password' ).trim()
                };
                // Create new user
                Ember.run( function(){
                    Ember.$.ajax( {
                        url: config.APP.signup_api_host + '/users',
                        type: 'POST',
                        dataType: 'json',
                        data: data
                    } ).then(
                        function( response, status, xhr ){
                            _this.get( 'session' ).authenticate( 'authenticator:akx', data )
                                .then(function( onboardingResponse, textStatus, onboardingXhr ){
                                    _this.set( 'isLocked', false );
                                } )
                                .catch( function( onboardingXhr ){
                                    _this.set( 'isLocked', false );
                                    _this.get( 'akxUtil' ).handleError( xhr, {
                                        scope: _this
                                    } );
                                } );
                        },
                        function( xhr, status, error ){
                            if( xhr.status === 409 &&
                                Array.isArray( xhr.responseJSON.errors ) &&
                                xhr.responseJSON.errors.length === 1 &&
                                Array.isArray( xhr.responseJSON.errors[ 0 ].email ) &&
                                xhr.responseJSON.errors[ 0 ].email.length === 1 &&
                                typeof xhr.responseJSON.errors[ 0 ].email[ 0 ] === 'string'
                            ){
                                _this.notify.warning( {
                                    raw: xhr.responseJSON.errors[ 0 ].email[ 0 ],
                                    closeAfter: null
                                } );
                            }
                            else{
                                _this.get( 'akxUtil' ).handleError( xhr, {
                                    scope: _this
                                } );
                            }
                            _this.set( 'isLocked', false );
                        }
                    );
                } );
            } ).catch( function(){
                _this.set( 'isLocked', false );
            } );
        }
    }
} );
