import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import CloseMixin from 'akx-app/mixins/close-side-panel';

export default Ember.Route.extend( StringObjectMixin, CloseMixin, {
    activate(){
        document.title = "Accounts";
    },
    model(){
        return Ember.RSVP.hash( {
            accounts: this.store.findAll( 'account' ),
            tickets: this.store.findAll( 'ticket' )
        } );
    },
    afterModel( model ){
        this._super( ...arguments );
        if( !Ember.isEmpty( model.tickets ) ){
            let tickets = model.tickets.filter( ( ticket )=>{
                return ticket.get( 'isNewAccount' ) && ticket.get( 'isOpen' );
            } );
            if( !Ember.isEmpty( tickets ) ){
                 let promises = tickets.map( ( ticket )=>{
                    return this.store.query( 'ticket-message', { ticket_id: ticket.id } );
                } );

                return Ember.RSVP.Promise.all( promises ).then( ()=>{
                    return model[ 'ticketMessages' ] = this.store.peekAll( 'ticket-message' );
                } );
            }
        }
    },
    setupController( controller, model ){
        this._super( ...arguments );

        if( !Ember.isEmpty( model.ticketMessages ) ){
            let accountRequests = model.ticketMessages.map( ( message )=>{
                if( message.get( 'notes' ).substring( 0, 10 ) === 'Requesting' ){
                    return {
                        id: message.get( 'ticket_id' ),
                        currencyID: message.get( 'notes' ).substring( 17, 20 )
                    };
                }
                return [];
            } );
            controller.set( 'accountRequests', accountRequests );
        }
    },

    renderTemplate(){
        Ember.run.scheduleOnce( 'afterRender', ()=>{
            Ember.$( '[data-toggle="tooltip"]' ).tooltip();
        } );
        this.render( 'accounts/index' );
    },
} );
