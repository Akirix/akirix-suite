import Ember from 'ember';

export default Ember.Route.extend( {

    setupController: function( controller, model ){
        controller.set( 'email', null );
    },

    renderTemplate: function( controller, model ){
        this.render( 'forgot' );
    },

    activate: function(){
        document.title = "Password Recovery";
    },

    actions: {

    }
} );
