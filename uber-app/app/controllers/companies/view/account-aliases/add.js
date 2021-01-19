import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: [ 'application' ],

    validations: {
        'accountAlias.account_id': {
            presence: true
        },
        'accountAlias.wire_instruction_id': {
            presence: true
        },
        'accountAlias.name': {
            presence: true
        }
    },

    actions: {
        createAccountAlias: function(){
            var self = this;
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );
                    var accountAlias = self.get( 'accountAlias' );
                    accountAlias.company_id = self.get( 'company_id' );

                    var newAlias = self.store.createRecord( 'account-alias', accountAlias );

                    newAlias.save().then(
                        function(){
                            self.set( 'isLocked', false );
                            var route = self.container.lookup( 'route:companies.view.account-aliases' );
                            self.notify.success( 'New Preferred Account created successfully.', { closeAfter: 5000 } );
                            route.refresh();
                            self.transitionToRoute( 'companies.view.account-aliases' );
                        },

                        function( xhr ){
                            self.set( 'isLocked', false );
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );
                        } );

                },
                function(){

                } );
        }
    }

} );