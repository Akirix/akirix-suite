import Ember from 'ember';

export default Ember.Controller.extend( {
    needs: [ 'application' ],
    registrationBinding: 'controllers.application.content'
} );
