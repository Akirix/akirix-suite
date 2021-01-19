import Ember from 'ember';
import AkxUtil from 'uber-app/utils/akx-util';
import ticketModel from 'uber-app/models/ticket';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( {

    queryParams: [ 'status', 'page', 'perPage' ],
    status: null,

    page: 1,
    perPage: 25,

    sortProperties: [ 'order' ],
    sortAscending: false,

    ticketStatusUpdated: function(){
        var self = this;
        Ember.run.next( function(){
            self.send( 'refreshTicket' );
        } );
    }.observes( 'status' )
} );
