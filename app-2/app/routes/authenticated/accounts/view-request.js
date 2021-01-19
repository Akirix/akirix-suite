import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( StringObjectMixin, {
    model( params ){
        return Ember.RSVP.hash( {
            ticketMessages: this.store.query( 'ticket-message', { ticket_id: params.ticket_id } ),
            ticket: this.store.findRecord( 'ticket', params.ticket_id )
        } );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        this.send( 'openSidePanel', 'accounts/view-request', '', controller );
        // Get notes and split at period
        let notes = model.ticketMessages.objectAt( 0 ).get( 'notes' ).split( '.' );

        // Parse out: balance, volume in, and volume in frequency from second sentence
        let idxOfFirstBetween = notes[ 1 ].indexOf( 'between' );
        let idxOfFirstAnd = notes[ 1 ].indexOf( 'and' );
        let idxOfFirstVolume = notes[ 1 ].indexOf( 'volume' );

        // Parse out: out volume frequency, and out volume from third sentence
        let trimNOtes = notes[ 2 ].trim();
        let idxOfSecondBetween = trimNOtes.indexOf( 'between' );
        let idxOfSecondVolume = trimNOtes.indexOf( 'volume' );

        controller.setProperties( {
            currencyId: notes[ 0 ].substring( 17, 20 ),
            balance: notes[ 1 ].substring( idxOfFirstBetween + 7, idxOfFirstAnd ),
            inVolumeFrequency: notes[ 1 ].substring( idxOfFirstAnd + 8, idxOfFirstVolume ),
            inVolume: notes[ 1 ].substring( idxOfFirstVolume + 18, notes[ 1 ].length ),
            outVolumeFrequency: trimNOtes.substring( 4, idxOfSecondVolume ),
            outVolume: trimNOtes.substring( idxOfSecondBetween + 7, notes[ 2 ].length )
        } );
    }
} );
