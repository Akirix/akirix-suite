import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import DirtyCheck from 'akx-app/mixins/dirty-check';
import lookupValidator from 'ember-changeset-validations';
import ticketMessageValidations from 'akx-app/validations/ticket-messages';
import ticketValidations from 'akx-app/validations/tickets';
import Changeset from 'ember-changeset';

export default Ember.Route.extend( StringObjectMixin, DirtyCheck, {
    model(){
        return Ember.RSVP.hash( {
            ticket: this.store.createRecord( 'ticket', {
                company_id: this.get( 'session.data.authenticated.company.id' )
            } ),
            ticket_messages: this.store.createRecord( 'ticket-message', {
                user_id: this.get( 'session.data.authenticated.user.id' ),
                notes: '',
                documents: Ember.A()
            } )
        } );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        
        let ticketChangeset = new Changeset(
            model.ticket,
            lookupValidator( ticketValidations ),
            ticketValidations
        );
        let ticketMessageChangeset = new Changeset(
            model.ticket_messages,
            lookupValidator( ticketMessageValidations ),
            ticketMessageValidations
        );
        controller.setProperties( {
            ticketChangeset: ticketChangeset,
            ticketMessageChangeset: ticketMessageChangeset,
            isLocked: false
        } );
    },

    renderTemplate(){
        this.render( 'tickets/add', {
            into: 'authenticated'
        } );
    },

    actions: {
        willTransition( transition ){
            let controller = this.controllerFor( this.routeName );
            let ticketIsDirty = controller.get( 'ticketChangeset.isDirty' );
            let ticketMessageIsDirty = controller.get( 'ticketMessageChangeset.isDirty' );
            let tickedDestroyed = controller.get( 'model.ticket.isDeleted' );
            let tickedMessageDestroyed = controller.get( 'model.ticket_messages.isDeleted' );
            let ticketIsNew = controller.get( 'model.ticket.isNew' );
            let tickedMessageIsNew = controller.get( 'model.ticket_messages.isNew' );

            if( ticketMessageIsDirty || ticketIsDirty || ( !( tickedDestroyed && tickedMessageDestroyed ) && ( ticketIsNew && tickedMessageIsNew ) ) ){
                let response = confirm( 'You have unsaved changes that will be lost. Are you sure you want to navigate away from this page?' );
                if( response ){
                    controller.get( 'model.ticket' ).destroyRecord();
                    controller.get( 'model.ticket_messages' ).destroyRecord();

                    return response;
                }
                transition.abort();
            }
            return true;
        }
    }
} );
