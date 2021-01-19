import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    renderTemplate: function( controller, model ){
        var _this = this;
        var routeName = _this.controllerFor( 'verification' ).get( 'routeMap' )[ _this.get( 'documentTypeName' ) ];
        var subController = _this.controllerFor( 'verification.' + routeName );

        this.render( 'verification.default', {
            controller: subController,
            into: 'verification',
            outlet: 'verificationOutlet'
        } );
    }
} );
