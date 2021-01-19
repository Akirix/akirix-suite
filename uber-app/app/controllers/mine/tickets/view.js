import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    ticketPriorities: [
        { label: 'Low', val: 0 },
        { label: 'Medium', val: 1 },
        { label: 'High', val: 2 }
    ],

    validations: {
        'ticket.priority': {
            presence: true
        },
        'ticket.uber_user_id': {
            presence: true
        }
    },

    restrictions: [
        { label: 'Please Select Tag', val: null },
        { label: 'Accounts', val: 'accounts' },
        { label: 'Foreign Exchange', val: 'fx' },
        { label: 'Invoice', val: 'invoice' },
        { label: 'Project', val: 'project' },
        { label: 'Technical', val: 'tech' },
        { label: 'Wire: In', val: 'wire-in' },
        { label: 'Wire: Out', val: 'wire-out' },
        { label: 'Wire: Internal', val: 'wire-internal' }
    ],

    messagesUpdated: function(){
        this.loadMessages();
    }.observes( 'ticket' ),

    loadMessages: function(){
        var self = this;
        this.store.find( 'ticket-message', { ticket_id: self.get( 'ticket.id' ) } ).then( function( messages ){
            messages.forEach( function( msg ){
                msg.set( 'documents', self.store.find( 'document', { model: 'ticket-message', model_id: msg.id } ) );
            } );
            self.set( 'ticketMessages', messages );
        } );
    },

    actions: {
        addTicketMessage: function(){
            var self = this;
            if( this.get( 'data.notes' ) ){
                self.set( 'isLocked', true );
                var newTicketMessage = self.store.createRecord( 'ticket-message', {
                    ticket_id: self.get( 'ticket.id' ),
                    notes: self.get( 'data.notes' )
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
                            function(){
                                self.loadMessages();
                                self.set( 'data', {
                                    ticket_id: null,
                                    notes: null
                                } );
                                self.set( 'documents', [] );
                                self.notify.success( 'New Message added', { closeAfter: 5000 } );
                                self.set( 'isLocked', false );
                            },
                            function( xhr ){
                                self.get( 'akxUtil' ).handleError( xhr, {
                                    scope: self
                                } );
                            } );
                    } );
            }
            else{
                self.notify.error( "Message can't be blank", { closeAfter: 4000 } );
            }
        },
        updateTicket: function(){
            var self = this;
            var ticket = this.get( 'ticket' );
            this.validate().then( function(){
                self.set( 'isLock', true );
                ticket.save().then( function(){
                        self.set( 'isLocked', false );
                        var route = self.container.lookup( 'route:mine.tickets' );
                        self.notify.success( 'Ticket updated successfully.', { closeAfter: 5000 } );
                        route.refresh();
                        self.transitionToRoute( 'mine.tickets' );
                    },
                    function( xhr ){
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    } );
            } );
        },

        closeTicket: function(){
            var self = this;
            var ticket_id = this.get( 'ticket.id' );
            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/tickets/' + ticket_id + '/close',
                type: 'post',
                contentType: "application/json; charset=utf-8",
                dataType: 'json'
            } ).then( function(){
                    var route = self.container.lookup( 'route:mine.tickets' );
                    self.notify.success( 'Ticket closed successfully.', { closeAfter: 5000 } );
                    route.refresh();
                    self.transitionToRoute( 'mine.tickets' );
                },

                function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                } );
        },

        openTicket: function(){
            var self = this;
            var ticket_id = this.get( 'ticket.id' );
            Ember.run( function(){
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/tickets/' + ticket_id + '/open',
                    type: 'post',
                    contentType: "application/json; charset=utf-8",
                    dataType: 'json'
                } ).then(
                    function(){
                        var route = self.container.lookup( 'route:mine.tickets' );
                        self.notify.success( 'Ticket moved to pending.', { closeAfter: 5000 } );
                        route.refresh();
                        self.transitionToRoute( 'mine.tickets' );
                    },
                    function( xhr ){
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    } );
            } );
        }
    }
} );