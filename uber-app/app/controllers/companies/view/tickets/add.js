import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    priorityArray: [
        { label: 'Low', val: 0 },
        { label: 'Medium', val: 1 },
        { label: 'High', val: 2 }
    ],

    validations: {
        'ticket.title': {
            presence: true
        },
        'ticket.priority': {
            presence: true
        },
        'ticket.uber_user_id': {
            presence: true
        },
        'ticket.notes': {
            presence: true
        }
    },

    actions: {

        createTicket: function(){
            var self = this;
            this.validate().then(
                function(){
                    self.get( 'isLocked', true );
                    var newTicket = self.store.createRecord( 'ticket', {
                        title: self.get( 'ticket.title' ),
                        company_id: self.get( 'ticket.company_id' ),
                        priority: self.get( 'ticket.priority' ),
                        uber_user_id: self.get( 'ticket.uber_user_id' )
                    } );
                    newTicket.save().then(
                        function(){
                            var newTicketMessage = self.store.createRecord( 'ticket_message', {
                                notes: self.get( 'ticket.notes' ),
                                ticket_id: newTicket.id
                            } );
                            newTicketMessage.save().then(
                                function(){
                                    var promises = Ember.A();

                                    // Save Documents
                                    self.get( 'documents' ).forEach( function( item ){
                                        item.set( 'model_id', newTicketMessage.id );
                                        item.set( 'status', 1 );
                                        promises.push( item.save() );
                                    } );
                                    Ember.RSVP.Promise.all( promises ).then(
                                        function( resolvedPromises ){
                                            self.set( 'isLocked', false );
                                            self.notify.success( 'Support Ticket sent.', { closeAfter: 5000 } );
                                            var route = self.container.lookup( 'route:companies.view.tickets' );
                                            route.refresh();
                                            self.transitionToRoute( 'companies.view.tickets' );
                                        },
                                        function(){
                                            self.set( 'isLocked', false );
                                        }
                                    );
                                },
                                function(){
                                    self.set( 'isLocked', false );
                                }
                            );
                        },
                        function( xhr ){
                            self.get( 'isLocked', false );
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