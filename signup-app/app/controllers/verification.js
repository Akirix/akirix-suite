import Ember from 'ember';

export default Ember.Controller.extend( {
    needs: [ 'application' ],
    registration: Ember.computed.alias( 'controllers.application.content' ),
    routeMap: {
        "corporate_documents": "corporate-documents",
        "primary_id": "primary-id",
        "secondary_id": "secondary-id",
        "tax_identity": "tax-identity",
        "financial_identity": "financial-identity",
        "proof_of_address": "proof-of-address",
        "w8_ben": "w8-ben",
        "w8_ben_e": "w8-ben-e",
        "owner_id": "owner-id"
    },

    completeWatcher: function(){
        this.send( 'processDocumentTypes' );
    }.observes( 'registration.documents' ),

    actions: {
        processDocumentTypes: function(){
            return true;
        }
    }
} );
