import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import AkxUtil from 'uber-app/utils/akx-util';
import signupModel from 'uber-app/models/signup-registration';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        var registration = this.modelFor( 'registrations/view' );
        var subDocument = registration.documents.findBy( '_id', params.sub_document_id );
        var akxUtil = this.get( 'akxUtil' );

        return Ember.RSVP.hash( {
            document: this.get( 'akxUtil' )._sendRequest( '/signupDocuments/' + subDocument.document_id, 'get' ).then( function( result ){
                return result.data.document;
            } ),
            registrationDocument: subDocument,
            exemption: registration.documents.findBy( '_id', params.sub_document_id ),
            documentTypes: akxUtil._sendRequest( '/signupDocumentTypes?account_type=' + registration.account_type, 'get' ).then( function( result ){
                return result.data.documentTypes;
            } )
        } );
    },

    renderTemplate: function( controller, model ){
        this.render( 'registrations.view-document', {
            outlet: 'paneSecondary',
            into: 'registrations'
        } );
    },

    actions: {
        refreshViewExemptionModel: function(){
            return this.refresh();
        }
    }
} );

