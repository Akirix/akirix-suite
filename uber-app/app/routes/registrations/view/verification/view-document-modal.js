import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import AkxUtil from 'uber-app/utils/akx-util';
import signupModel from 'uber-app/models/signup-registration';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    activate: function(){
        this.controllerFor( 'application' ).set( 'show-modal', true );
    },

    model: function( params ){
        var registration = this.modelFor( 'registrations/view' );
        var subDocument = registration.documents.findBy( '_id', params.sub_document_id );

        return Ember.RSVP.hash( {
            document: this.get( 'akxUtil' )._sendRequest( '/signupDocuments/' + subDocument.document_id, 'get' ).then( function( result ){
                return result.data.document;
            } ),
            registrationDocument: subDocument
        } );
    },

    renderTemplate: function( controller, model ){
        this.render( 'registrations.view-document-modal', {
            outlet: 'modal',
            into: 'application'
        } );
    }
} );

