import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    validations: {
        "user.last_name": {
            presence: true
        },
        "user.first_name": {
            presence: true
        },
        "user.email": {
            presence: true
        },
        "user.phone_mobile": {
            presence: true
        }
    },

    actions: {
        createUser: function(){
            var self = this;
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );
                    var newUser = self.store.createRecord( 'User', {
                        first_name: self.get( 'user.first_name' ),
                        last_name: self.get( 'user.last_name' ),
                        company_id: self.get( 'company_id' ),
                        email: self.get( 'user.email' ),
                        phone_mobile: self.get( 'user.phone_mobile' )
                    } );
                    newUser.save().then(
                        function(){
                            self.set( 'isLocked', false );
                            var route = self.container.lookup( 'route:companies.view.users' );
                            route.refresh();
                            self.transitionToRoute( 'companies.view.users', self.get( 'company_id' ) );
                        },
                        function( xhr ){
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );
                            self.set( 'isLocked', false );
                        }
                    );
                },
                function(){

                }
            );
        }
    }
} );