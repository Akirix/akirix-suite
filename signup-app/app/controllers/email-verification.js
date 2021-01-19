import Ember from 'ember';
import EmberValidations from 'ember-validations';
import LoginControllerMixin from 'simple-auth/mixins/login-controller-mixin';

export default Ember.Controller.extend( {
    email: null,
    token: null,
    needs: ['application'],
    emailVerified: false,
    queryParams: [ 'email', 'token' ]
} );
