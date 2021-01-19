import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){

    },

    setupController: function( controller, model ){

    },

    renderTemplate: function( controller, model ){
        this.render( 'wires/download', {
            into: 'wires',
            outlet: 'paneSecondary'
        } );
    }
} );


