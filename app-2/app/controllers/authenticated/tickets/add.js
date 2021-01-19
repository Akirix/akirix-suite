import Ember from 'ember';

export default Ember.Controller.extend( {
    actions: {
        createTicket(){
            let ticket = this.get( 'ticketChangeset' );
            let ticketMessage = this.get( 'ticketMessageChangeset' );
            let promises = [ ticket.validate(), ticketMessage.validate() ];
            Ember.RSVP.Promise.all( promises ).then( ()=>{
                if( ticket.get( 'isValid' ) && ticketMessage.get( 'isValid' ) ){
                    return ticket.save();
                }
            } ).then( ()=>{
                if( ticket.get( 'isValid' ) && ticketMessage.get( 'isValid' ) ){
                    ticketMessage.set( 'ticket_id', ticket.get( 'id' ) );
                    return ticketMessage.save();
                }
            } ).then( ()=>{
                if( ticketMessage.get( 'isValid' ) && !Ember.isEmpty( ticketMessage.get( 'documents' ) ) ){
                    promises = [];
                    ticketMessage.get( 'documents' ).forEach( function( doc ){
                        doc.set( 'model_id', ticketMessage.get( 'id' ) );
                        doc.set( 'status', 1 );
                        promises.push( doc.save() );
                    } );
                    return Ember.RSVP.Promise.all( promises );
                }
            } ).then( ()=>{
                this.set( 'isLocked', false );
                if( ticket.get( 'isValid' ) && ticketMessage.get( 'isValid' ) ){
                    this.transitionToRoute( 'authenticated.tickets' );
                }
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        },
        cancelTicket(){
            this.get( 'ticketChangeset' ).rollback();
            this.get( 'ticketMessageChangeset' ).rollback();
            Ember.RSVP.Promise.all( [
                this.get( 'model.ticket' ).destroyRecord(),
                this.get( 'model.ticket_messages' ).destroyRecord()
            ] ).then( ()=>{
                this.transitionToRoute( 'authenticated.tickets' );
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        }
    }
} );