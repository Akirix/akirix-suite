import Ember from 'ember';
var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( {
    needs: [ 'application' ],

    actions: {}
} );