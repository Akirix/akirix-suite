import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'signup-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    validations: {
        email: {
            email: {
                allowBlank: false
            },
            presence: true
        }
    },
    actions: {
        forgot: function(){
            var self = this;
            var adapter = self.get( 'akxAdapter' );
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );

                    return adapter.sendRequest( '/password-recoveries', 'post', {
                        email: self.get( 'email' )
                    } ).then( function(){
                        self.notify.info( { raw: 'Password Updated, now redirecting you back to the login page' } );
                        Ember.run.later( self, function(){
                            self.transitionToRoute( 'login' );
                        }, 5000 );
                    } ).catch( function( err ){
                        var invalidParam = err.jqXHR.status === 400 &&
                            Array.isArray( err.jqXHR.responseJSON.errors ) && err.jqXHR.responseJSON.errors.length === 1 &&
                            _.isString( err.jqXHR.responseJSON.errors[ 0 ] );

                        if( invalidParam ){
                            self.notify.alert( { raw: err.jqXHR.responseJSON.errors[ 0 ] } );
                        }
                        else{
                            self.notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                        }
                    } );

                },
                function(){
                } );
        }
    }
} );
