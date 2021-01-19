import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import AkxUtil from 'uber-app/utils/akx-util';
import signupModel from 'uber-app/models/signup-registration';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        var akxUtil = this.get( 'akxUtil' );
        var registration = this.modelFor( 'registrations/view' );

        return akxUtil._sendRequest( '/signupDocumentTypes', 'get' ).then( function( result ){
            return result.data;
        } );
    },

    setupController: function( controller, model ){
        this._super( controller, model );
        controller.set( 'type', 'file' );
        controller.set( 'document_type', null );
        controller.set( 'exemption', null );
        controller.set( 'exemption_reason', null );
    },

    renderTemplate: function( controller, model ){
        this.render( 'registrations.add-document', {
            outlet: 'paneSecondary',
            into: 'registrations'
        } );
    }
} );

