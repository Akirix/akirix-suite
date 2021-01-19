import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    wireInstructionSelected: null,

    validations: {
        'wireInstructionSelected': {
            presence: true
        },
    },

    actions: {
        createWireInstruction: function(){
            var self = this;

            this.validate().then(
                function(){
                    var companyWireInstruction = {
                        company_id: self.get( 'company_id' ),
                        wire_instruction_id: self.get( 'wireInstructionSelected.id' )
                    };

                    var newWireInstruction = self.store.createRecord( 'company-wire-instruction', companyWireInstruction );

                    self.set( 'isLocked', true );

                    newWireInstruction.save().then(
                        function(){
                            self.set( 'isLocked', false );
                            self.notify.success( 'Wire Instruction created.', { closeAfter: 10000 } );
                            var route = self.container.lookup( 'route:companies.view.wire-instructions' );
                            route.refresh();
                        },
                        function( xhr ){
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );

                            self.set( 'isLocked', false );
                        }
                    );
                },
                function( xhr ){
                    console.log( xhr );
                } );
        }
    }

} )
;