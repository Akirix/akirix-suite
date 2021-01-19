import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: [ 'application' ],

    validations: {
        "account.currency_id": {
            presence: true
        }
    },

    actions: {
        createAccount: function(){
            var self = this;
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );

                    var newAccount = self.store.createRecord( 'Account', {
                        name: self.get( 'account.name' ),
                        company_id: self.get( 'company_id' ),
                        currency_id: self.get( 'account.currency_id' )
                    } );
                    newAccount.save().then(
                        function(){
                            self.set( 'isLocked', false );
                            var route = self.container.lookup( 'route:companies.view.accounts' );
                            route.refresh();
                            self.transitionToRoute( 'companies.view.accounts', self.get( 'company_id' ) );
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