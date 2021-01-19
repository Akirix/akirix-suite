import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    queryParams: [ 'preferred' ],

    isPreferred: function(){
        return this.get( 'model.type' ) === 'Preferred' ? true : false;
    }.property( 'model.type' ),

    actions: {
        deleteWireInstruction: function( wire_instruction_id ){
            var self = this;
            var searchParams = {
                company_id: this.get( 'company.id' ),
                wire_instruction_id: wire_instruction_id
            };

            this.store.find( 'companyWireInstruction', searchParams ).then( function( companyWireIns ){
                if( !Ember.isEmpty( companyWireIns ) && companyWireIns.objectAt( 0 ) ){
                    companyWireIns.objectAt( 0 ).destroyRecord().then( function(){
                        var route = self.container.lookup( 'route:companies.view.wire-instructions' );
                        self.notify.success( 'Wire instruction deleted successfully.', { closeAfter: 5000 } );
                        route.refresh();
                        self.transitionToRoute( 'companies.view.wire-instructions' );
                    } );
                }
            }, function( xhr ){
                self.get( 'akxUtil' ).handleError( xhr, {
                    scope: self
                } );
            } );
        }
    }
} );