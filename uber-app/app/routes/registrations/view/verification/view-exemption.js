import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import AkxUtil from 'uber-app/utils/akx-util';
import signupModel from 'uber-app/models/signup-registration';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params, transition ){
        var _this = this;
        var akxUtil = this.get( 'akxUtil' );
        var registration = this.modelFor( 'registrations/view' );

        return Ember.RSVP.hash( {
            exemption: registration.documents.findBy( '_id', params.sub_document_id ),
            documentTypes: akxUtil._sendRequest( '/signupDocumentTypes?account_type=' + registration.account_type, 'get' ).then( function( result ){
                return result.data.documentTypes;
            } )
        } );
    },

    renderTemplate: function( controller, model ){
        this.render( 'registrations.view-exemption', {
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

