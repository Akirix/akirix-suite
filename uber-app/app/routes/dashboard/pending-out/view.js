import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import DirtyCheckRouteMixin from 'uber-app/mixins/dirty-check';

export default Ember.Route.extend( AuthenticatedRouteMixin, DirtyCheckRouteMixin, {
    model: function( params ){
        return this.store.find( 'wire', params.wire_id );
    },

    setupController: function( controller, model ){
        controller.set( 'wire', model );

        controller.store.find( 'bank-route' ).then( function( bankRoutes ){
            controller.set( 'bankRoutes', bankRoutes );
        } );

        if( !Ember.isEmpty( model.get( 'intermediary_bank_name' ) ) ){
            controller.set( 'useIntBank', true );
        }
        else{
            controller.set( 'useIntBank', false );
        }
    },

    renderTemplate: function(){
        this.render( 'dashboard/pending-out/view', {
            into: 'dashboard',
            outlet: 'paneSecondary'
        } );
    }
} );
