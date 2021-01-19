import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: [ 'application' ],

    hasCompany: function(){
        if( this.get( 'model.company_id' ) ){
            return true;
        }
        else{
            return false;
        }
    }.property( 'model.company_id' ),

    actions: {

        deleteAccountAliasRule: function(){
            var self = this;
            var account_alias_rule = self.get( 'model' );

            account_alias_rule.deleteRecord();

            account_alias_rule.save().then(
                function(){
                    var route = self.container.lookup( 'route:account-alias-rules.index' );
                    self.notify.success( 'Preferred Account rule deleted successfully.', { closeAfter: 5000 } );
                    route.refresh();
                    self.transitionToRoute( 'account-alias-rules.index' );
                },
                function( xhr ){
                    account_alias_rule.rollback();
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                } );
        }
    }

} );