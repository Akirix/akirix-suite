import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'wire-batch', params.wire_batch_id );
    },

    setupController: function( controller, model ){
        controller.set( 'wireBatch', model );
        controller.store.find( 'bank-route' ).then( function( bankRoutes ){
            controller.set( 'bankRoutes', bankRoutes );
        } );
        controller.store.find( 'currency' ).then( function( currencies ){
            controller.set( 'currencies', currencies );
        } );
    },

    renderTemplate: function( controller, model ){
        this.send( 'checkTwoFactorAuthenticated' );
        this.render( 'dashboard/pending-out/view-batch', {
            into: 'dashboard',
            outlet: 'paneSecondary'
        } );
    }

} );
