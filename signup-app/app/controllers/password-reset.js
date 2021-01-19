import Ember from 'ember';
import EmberValidations from 'ember-validations';
import _ from 'lodash/lodash';
import config from 'signup-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    validations: {
        "password": {
            confirmation: {
                message: 'Please enter the same password again'
            },
            presence: {
                message: 'Please enter a password'
            }
        }
    },

    queryParams: [ 'token', 'email' ],

    actions: {
        submit: function( data ){
            var _this = this;
            var adapter = _this.get( 'akxAdapter' );
            var email = _this.get( 'email' );
            var token = _this.get( 'token' );
            var password = _this.get( 'password' );

            _this.validate()
                .then( function validateSuccess(){
                    _this.set( 'formLocked', true );

                    return adapter.sendRequest( '/password-recoveries/password-reset', 'post', {
                        email: email,
                        password: password,
                        token: token
                    } )
                        .then( function( result ){
                            _this.set( 'validated', false );
                            _this.notify.info( { raw: 'Password Updated, now redirecting you back to the login page' } );
                            _this.transitionToRoute( 'loading' );
                            Ember.run.later( _this, function(){
                                _this.transitionToRoute( 'login' );
                            }, 5000 );
                        } )
                        .catch( function( err ){
                            var invalidParam = err.jqXHR.status === 400 &&
                                Array.isArray( err.jqXHR.responseJSON.errors ) && err.jqXHR.responseJSON.errors.length === 1 &&
                                _.isString( err.jqXHR.responseJSON.errors[ 0 ] );

                            if( invalidParam ){
                                _this.notify.alert( { raw: err.jqXHR.responseJSON.errors[ 0 ] } );
                            }
                            else{
                                _this.notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                            }
                        } );
                } )
                .catch( _.noop )
                .finally( function(){
                    _this.set( 'formLocked', false );
                } );

        }
    }
} );
