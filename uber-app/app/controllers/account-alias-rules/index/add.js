import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: [ 'application' ],

    validations: {
    	"model.wire_instruction_id": {
    		presence: true
    	},
        "model.prefix": {
            presence: true,
            numericality: true
        },
        "model.total_length": {
            presence: true,
            numericality: true
        },
        "model.range_min": {
            numericality: {
                allowBlank: true
            }
        },
        "model.range_max": {
            numericality: {
                allowBlank: true
            }
        }
    },

    actions: {
        createRule: function(){
            var self = this;
            this.validate().then(
                function(){
                    var newRule = self.store.createRecord( 'account-alias-rule', {
                        prefix: self.get( 'model.prefix' ),
                        total_length: Number( self.get( 'model.total_length' ) ),
                        company_id: self.get( 'model.company_id' ),
                        range_min: self.get( 'model.range_min' ),
                        range_max: self.get( 'model.range_max' ),
                        wire_instruction_id: self.get( 'model.wire_instruction_id' )
                    } );
                    newRule.save().then(
                        function(){
                            self.set( 'isLocked', false );
                            var route = self.container.lookup( 'route:account-alias-rules.index' );
                            route.refresh();
                            self.transitionToRoute( 'account-alias-rules.index' );
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