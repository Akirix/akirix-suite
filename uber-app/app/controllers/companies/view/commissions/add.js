import Ember from 'ember';
import EmberValidations from 'ember-validations';
var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    affiliate: null,

    validations: {
        'commission.company_id': {
            presence: true
        },
        'commission.rate': {
            presence: true,
            numericality: {
                greaterThan: 0,
                lessThan: 50
            }
        },
        'commission.start_date': {
            presence: true
        },
        'commission.end_date': {
            presence: true
        }
    },

    actions: {

        addCommission: function(){
            var self = this;
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );
                    self.set( 'commission.rate', self.get( 'commission.rate' ) );
                    var newCommission = self.store.createRecord( 'commission', self.get( 'commission' ) );
                    newCommission.save().then(
                        function(){
                            self.set( 'isLocked', false );
                            var route = self.container.lookup( 'route:companies.view.commissions' );
                            self.notify.success( 'Commission added', { closeAfter: 5000 } );
                            route.refresh();
                            self.transitionToRoute( 'companies.view.commissions' );
                        },
                        function( xhr ){
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );
                        }
                    );
                },
                function(){

                }
            );
        }
    }

} );