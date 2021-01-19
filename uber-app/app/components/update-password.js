import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Component.extend( EmberValidations.Mixin, {
    setUser: function(){
        this.set( 'user', {
            password: '',
            passwordConfirmation: ''
        } );
    }.on( 'init' ),
    validations: {
        'user.password': {
            presence: true,
            confirmation: true,
            passwordRequirements: true
        }
    },
    actions: {
        updatePassword: function(){
            var self = this;
            this.validate().then( function(){
                self.set( 'isLocked', true );
                var user = self.get( 'user' );
                self.get( 'akxUtil' )._sendRequest( '/uberUsers/password_update', 'put', { uberUser: user } )
                    .then( function(){
                        self.sendAction( 'closeOverPane' );
                    } ).catch( function( xhr ){
                        self.set( 'isLocked', false );
                        self.get( 'akxUtil' ).handleError( xhr.jqXHR, {
                            scope: self
                        } );
                    } );
            } );
        }

    }
} );