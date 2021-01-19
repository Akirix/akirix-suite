import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import config from 'signup-app/config/environment';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    activate: function(){
        document.title = config.APP.company.name + " | Ultimate Beneficiary Owners";
    },

    setupController: function( controller, model ){
        var registration = this.modelFor( 'application' );
        registration.get( 'owners' ).forEach( function( owner ){
            if( !owner.hasOwnProperty( 'hasError' ) ){
                Ember.set( owner, 'hasError', false );
            }
        } );

        registration.get( 'executives' ).forEach( function( executive ){
            if( !executive.hasOwnProperty( 'hasError' ) ){
                Ember.set( executive, 'hasError', false );
            }
        } );

        if( registration.get( 'user.is_owner' ) ){
            if( registration.get( 'isPersonal' ) ){
                controller.set( 'uboCountOptions', [ controller.get( 'uboCountOptions' )[ 1 ] ] );
            }
            else{
                controller.get( 'uboCountOptions' ).shift();
            }
            controller.set( 'uboCount', 1 );
        }
    }
} );
