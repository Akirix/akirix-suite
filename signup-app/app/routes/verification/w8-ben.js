import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import defaultVerificationRoute from 'signup-app/routes/verification/default';

export default defaultVerificationRoute.extend( {
    documentTypeName: 'w8_ben'
} );
