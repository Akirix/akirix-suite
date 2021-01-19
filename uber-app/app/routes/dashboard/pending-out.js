import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function(){
        var promises = {
            wires: this.store.find( 'wire', { type: 0, status: [ 0 ] } ),
            startedWires: this.store.find( 'wire', { type: 0, status: 1, wire_batch_id: 'null' } ),
            newBatches: this.store.find( 'wire-batch', { status: 0 } )
        };
        return Ember.RSVP.hash( promises );
    },

    setupController: function( controller, model ){
        controller.set( 'wires', model.wires );
        controller.set( 'startedWires', model.startedWires );
        controller.set( 'newBatches', model.newBatches );
    },

    resetController: function( controller ){
        controller.get( 'newBatches' )
            .forEach( function( batch ){
                batch.set( 'isVisible', false );
            } )
    },

    renderTemplate: function(){
        this.render( 'dashboard/nav-pending-out', {
            into: 'dashboard',
            outlet: 'dashboardNavbar'
        } );

        this.render( 'dashboard/pending-out', {
            into: 'dashboard',
            outlet: 'panePrimary'
        } );
    }
} );
