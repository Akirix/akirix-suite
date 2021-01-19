import Ember from 'ember';
import EmberValidations from 'ember-validations';
import LoginControllerMixin from 'simple-auth/mixins/login-controller-mixin';
import config from 'signup-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, LoginControllerMixin, {
    authenticatorFactory: 'authenticator:akx',
    queryParams: [ 'token' ],
    validations: {
        email: {
            presence: {
                'if': function( obj, validator ){
                    return Ember.isEmpty( obj.get( 'token' ) );
                }
            }
        },
        password: {
            presence: {
                'if': function( obj, validator ){
                    return Ember.isEmpty( obj.get( 'token' ) );
                }
            }
        }
    },

    actions: {
        login: function(){
            var _this = this;
            this.validate().then( function(){
                var data = {};
                if( !Ember.isEmpty( _this.get( 'token' ) ) ){
                    data[ 'token' ] = _this.get( 'token' );
                }
                else{
                    data[ 'email' ] = _this.get( 'email' );
                    data[ 'password' ] = _this.get( 'password' );
                }
                _this.get( 'session' ).authenticate( _this.get( 'authenticatorFactory' ), data )
                    .then( function(){
                        _this.set( 'isLocked', false );
                    }, function( error ){
                        _this.set( 'isLocked', false );
                        if( error.status === 400 ){
                            _this.notify.alert( 'Incorrect email or password. Please try again.', { closeAfter: 5000 } );
                        }
                        else{
                            _this.notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                        }
                    }
                );
            } ).catch( function(){
                _this.set( 'isLocked', false );
            } );
        }
    }
} );
