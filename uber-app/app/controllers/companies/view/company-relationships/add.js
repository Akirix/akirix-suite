import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: [ 'application' ],

    validations: {
        'company_id': {
            presence: true
        },

    },

    actions: {
        createRelationship: function () {
            var self = this;
            this.validate().then(
                function () {
                    var newRel = self.store.createRecord( 'company-relationship', {
                        institution_id: self.get( 'institution_id' ),
                        company_id: self.get( 'company_id' )
                    } );
                    newRel.save().then(
                        function () {
                            self.set( 'isLocked', false );
                            var route = self.container.lookup( 'route:companies.view.company-relationships' );
                            route.refresh();
                            self.transitionToRoute( 'companies.view.company-relationships' );
                        },
                        function ( xhr ) {
                            self.set( 'isLocked', false );
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );
                        }
                    );
                },
                function () {

                }
            );
        }
    }

} );
