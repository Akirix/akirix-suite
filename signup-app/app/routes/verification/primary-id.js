import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import defaultVerificationRoute from 'signup-app/routes/verification/default';

export default defaultVerificationRoute.extend( {
    documentTypeName: 'primary_id',

    renderTemplate: function( controller, model ){
        var _this = this;
        var routeName = this.controllerFor( 'verification' ).get( 'routeMap' )[ this.get( 'documentTypeName' ) ];
        var subController = _this.controllerFor( 'verification.' + routeName );

        this.render( 'verification.primary-id', {
            controller: subController,
            into: 'verification',
            outlet: 'verificationOutlet'
        } );
    }
} );