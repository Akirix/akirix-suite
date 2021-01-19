import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( StringObjectMixin, {
    model( params ){
        return Ember.RSVP.hash( {
            ticket: this.store.findRecord( 'ticket', params.ticket_id ),
            ticket_messages: this.store.query( 'ticket-message', { ticket_id: params.ticket_id } )
        } );
    },

    afterModel( model ){
        this._super( ...arguments );
        let promises = [];
        model[ 'ticketMessages' ] = model.ticket_messages.toArray();
        model[ 'ticketMessages' ].forEach( ( msg )=>{
            promises.push( this.store.query( 'document', { model: 'ticket-message', model_id: msg.id } ).then( ( documents )=>{
                msg.set( 'documents', documents );
            } ) );
        } );
        return Ember.RSVP.Promise.all( promises );
    },

    setupController( controller ){
        this._super( ...arguments );
        this.send( 'openSidePanel', 'tickets.view', '', controller );
        controller.set( 'isLocked', false );
        controller.newChangeset();
    }
} );
