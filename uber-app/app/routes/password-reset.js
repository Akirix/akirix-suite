import Ember from 'ember';
export default Ember.Route.extend( {

    setupController: function( controller, model ){

    },

    renderTemplate: function( controller, model ){
        this.render( 'password-reset' );
    },

    activate: function(){
        document.title = "Password Reset";
    },

    actions: {

    }
} );
