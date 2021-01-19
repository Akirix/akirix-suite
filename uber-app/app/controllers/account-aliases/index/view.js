import Ember from 'ember';
import EmberValidations from 'ember-validations';
var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    isActive: function(){
        if( this.get( "model.status" ) ){
            return true;
        }
        else{
            return false;
        }
    }.property( 'model.status' ),

    hasClient: function(){
        if( this.get( 'model.client_company_id' && 'model.client_account_id' ) ){
            return true;
        }
        else{
            return false;
        }
    }.property( 'model.client_company_id', 'model.client_account_id' ),

    actions: {
        deactivateAccountAlias: function(){
            var self = this;
            var account_alias = self.get( 'model' );
            account_alias.destroyRecord().then(
                function(){
                    var route = self.container.lookup( 'route:account-aliases.index' );
                    self.notify.success( 'Preferred Account deactivated successfully.', { closeAfter: 5000 } );
                    route.refresh();
                    self.transitionToRoute( 'account-aliases.index' );
                },
                function( xhr ){
                    account_alias.rollback();
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                } );
        }

    }
} );