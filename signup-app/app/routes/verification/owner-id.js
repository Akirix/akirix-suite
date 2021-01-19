import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import defaultVerificationRoute from 'signup-app/routes/verification/default';

export default defaultVerificationRoute.extend( {
    documentTypeName: 'owner_id',

    queryParams: {
        documentTypeName: { refreshModel: true },
        uid: { refreshModel: true }
    },

    model: function( params ){
        var registration = this.modelFor( 'application' );
        return registration.owners[ params.uid ];
    },

    setupController: function( controller, model ){
        controller.set( 'owner', model );
    },

    renderTemplate: function( controller, model ){
        var _this = this;
        var routeName = this.controllerFor( 'verification' ).get( 'routeMap' )[ this.get( 'documentTypeName' ) ];
        var subController = _this.controllerFor( 'verification.' + routeName );

        this.render( 'verification.owner-id', {
            into: 'verification',
            outlet: 'verificationOutlet'
        } );
    }
} );