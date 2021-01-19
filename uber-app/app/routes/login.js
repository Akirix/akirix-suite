import Ember from 'ember';

export default Ember.Route.extend( {

    setupController: function( controller, model ){
        controller.set( 'identification', null );
        controller.set( 'password', null );
    },

    renderTemplate: function( controller, model ){
        this.render( 'login' );
    },

    actions: {}
} );
