import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import AkxUtil from 'uber-app/utils/akx-util';
import signupModel from 'uber-app/models/signup-registration';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    setupController: function( controller, model ){
        this._super( controller, model );
        controller.set( 'isLocked', false );
    },
    renderTemplate: function( controller, model ){
        this.send( 'checkTwoFactorAuthenticated' );
        this.render( 'registrations.complete', {
            into: 'registrations.view',
            outlet: 'registrationPrimary'
        } );
    },
    actions: {
        reloadCompleteModel: function(){
            this.refresh();
        }
    }
} );

