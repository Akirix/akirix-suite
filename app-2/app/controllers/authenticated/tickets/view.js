import Ember from 'ember';
import lookupValidator from 'ember-changeset-validations';
import ticketMessageValidations from 'akx-app/validations/ticket-messages';
import Changeset from 'ember-changeset';

export default Ember.Controller.extend( {
    session: Ember.inject.service(),

    getToken: function(){
        return this.get( 'session.data.authenticated.access_token' );
    }.property(),

    newChangeset(){
        let changeset = new Changeset(
            this.store.createRecord( 'ticket-message', {
                user_id: this.get( 'session.data.authenticated.user.id' ),
                ticket_id: this.get( 'model.ticket.id' ),
                notes: '',
                documents: Ember.A()
            } ),
            lookupValidator( ticketMessageValidations ),
            ticketMessageValidations,
            { skipValidate: true }
        );
        this.set( 'changeset', changeset );
    },

    refreshTicketMessages( id ){
        let msg = this.store.peekRecord( 'ticket-message', id );
        this.store.query( 'document', { model: 'ticket-message', model_id: msg.id } ).then( ( docs )=>{
            msg.set( 'documents', docs );
            this.get( 'model.ticketMessages' ).pushObject( msg );
            this.newChangeset();
            Ember.$( '.ticket-messages' ).animate( {
                scrollTop: Ember.$( '#scroll-to-bottom' ).offset().top
            }, 1000);
        } );
    },

    actions: {
        addMessage(){
            let changeset = this.get( 'changeset' );
            changeset.validate().then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    return changeset.save();
                }
                return changeset.get( 'isValid' );
            } ).then( ( isValid )=>{
                // Save Documents
                if( isValid && !Ember.isEmpty( changeset.get( 'documents' ) ) ){
                    let promises = Ember.A();
                    changeset.get( 'documents' ).forEach( ( item )=>{
                        item.set( 'model_id', changeset.get( 'id' ) );
                        item.set( 'status', 1 );
                        promises.push( item.save() );
                    } );
                    return Ember.RSVP.Promise.all( promises );
                }
                return isValid;
            } ).then( ( isValid )=>{
                this.set( 'isLocked', false );
                if( isValid ){
                    this.refreshTicketMessages( changeset.get( 'id' ) );
                }
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', err);
            } );
        },
        closeTicket(){
            let ticket = this.get( 'model.ticket' );
            this.get( 'akxUtil' ).authAjax( {
                type: 'post'
            }, `/tickets/${ticket.get( 'id' )}/close` ).then( ()=>{
                ticket.reload();
                this.send( 'closeSidePanel' );
            } ).catch( ( err )=>{
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        },
        openTicket(){
            let ticket = this.get( 'model.ticket' );
            this.get( 'akxUtil' ).authAjax( {
                type: 'post'
            }, `/tickets/${ticket.get( 'id' )}/open` ).then( ()=>{
                ticket.reload();
                this.send( 'closeSidePanel' );
            } ).catch( ( err )=>{
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        }
    }
} );
