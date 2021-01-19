import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( StringObjectMixin, {
    model( params ){
        return Ember.RSVP.hash( {
            account: this.store.peekRecord( 'account', params.account_id ),
            preferredWireInstructions: this.store.query( 'wire-instruction', { preferred: true } ),
            wireInstructions: this.store.findAll( 'wire-instruction' )
        } );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        let currencyID = model.account.get( 'currency_id' );
        let filteredInstructions;

        filteredInstructions = model.preferredWireInstructions.filter( ( instruction )=>{
            return instruction.get( 'currency_id' ) === currencyID;
        } );

        if( Ember.isEmpty( filteredInstructions ) ){
            filteredInstructions = model.wireInstructions.filter( ( instruction )=>{
                return instruction.get( 'currency_id' ) === currencyID;
            } );
        }

        controller.set( 'filteredInstructions', filteredInstructions );
    },

    renderTemplate(){
        this.render( 'transfers/index/view-instructions', {
            into: 'authenticated'
        } );
    }
} );
