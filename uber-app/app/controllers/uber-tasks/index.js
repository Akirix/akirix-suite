import Ember from 'ember';
import AkxUtil from 'uber-app/utils/akx-util';
import pagedArray from 'ember-cli-pagination/computed/paged-array';

export default Ember.Controller.extend( {

    queryParams: [ 'status', 'type', 'due_date', 'page', 'perPage' ],

    page: 1,
    perPage: 25,

    sortProperties: [ 'order' ],
    sortAscending: false,

    tasksStatusUpdated: function(){
        var self = this;
        Ember.run.next( function(){
            self.send( 'refreshTasks' );
        } );
    }.observes( 'status', 'type', 'due_date' )
} );