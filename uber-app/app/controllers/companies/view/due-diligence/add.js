import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    actions: {
        createDueDiligence: function(){
            var self = this;
            self.set( 'isLocked', true );
            var newDueDiligence = self.store.createRecord( 'uber-due-diligence', {
                company_id: self.get( 'company_id' ),
                options: JSON.stringify( self.get( 'options' ) )
            } );
            newDueDiligence.save().then(
            function(){
                self.set( 'isLocked', false );
                var route = self.container.lookup( 'route:companies.view.due-diligence' );
                route.refresh();
                self.transitionToRoute( 'companies.view.due-diligence' );
            } );
        }

    }
} );