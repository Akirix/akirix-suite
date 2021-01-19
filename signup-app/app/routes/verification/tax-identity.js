import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import defaultVerificationRoute from 'signup-app/routes/verification/default';

export default defaultVerificationRoute.extend( {
    documentTypeName: 'tax_identity',

    renderTemplate: function( controller, model ){
        var _this = this;
        var routeName = _this.controllerFor( 'verification' ).get( 'routeMap' )[ _this.get( 'documentTypeName' ) ];
        var subController = _this.controllerFor( 'verification.' + routeName );

        _this.render( 'verification.tax-identity', {
            controller: subController,
            into: 'verification',
            outlet: 'verificationOutlet'
        } );
    }
} );