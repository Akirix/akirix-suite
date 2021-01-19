import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import AkxUtil from 'uber-app/utils/akx-util';
import signupModel from 'uber-app/models/signup-registration';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function(){
        var akxUtil = this.get( 'akxUtil' );
        var registration = this.modelFor( 'registrations/view' );

        return Ember.RSVP.hash( {
            verifications: akxUtil._sendRequest( '/signupVerifications?user_id=' + registration.user_id, 'get' ).then( function( result ){
                return result.data.verifications;
            } ),
            documentTypes: akxUtil._sendRequest( '/signupDocumentTypes', 'get' ).then( function( result ){
                var documents = registration.get( 'documents' ).filterBy( 'status', 1 );

                if( registration.get( 'company.country' ) === 'US' ){
                    result.data.documentTypes = result.data.documentTypes.rejectBy( 'name', 'w8_ben' );
                    result.data.documentTypes = result.data.documentTypes.rejectBy( 'name', 'w8_ben_e' );
                }
                documents.forEach( function( doc ){
                    if( doc.document_type.indexOf( 'owner_id' ) > -1 ){
                        doc.document_type = 'owner_id';
                    }
                } );
                result.data.documentTypes.forEach( function( documentType ){
                    var currentDocuments = documents.filterBy( 'document_type', documentType.name );
                    var exemption = currentDocuments.findBy( 'exemption', true );
                    if( Ember.isEmpty( exemption ) ){
                        Ember.set( documentType, 'documents', currentDocuments );
                    }
                    else{
                        Ember.set( documentType, 'documents', [ exemption ] );
                    }
                } );
                return result.data.documentTypes;
            } )
        } );
    },

    afterModel: function( model ){
        if( !Ember.isEmpty( model.verifications ) ){
            var emailVerifications = [];
            var smsVerifications = [];

            model.verifications.forEach( function( item ){
                if( item.status === 0 ){
                    Ember.set( item, 'complete', false );
                }
                else{
                    Ember.set( item, 'complete', true );
                }

                if( item.type === 0 ){
                    emailVerifications.push( item );
                }
                else if( item.type === 1 ){
                    smsVerifications.push( item );
                }
            } );

            Ember.set( model, 'emailVerifications', emailVerifications );
            Ember.set( model, 'smsVerifications', smsVerifications );
        }
        else{
            Ember.set( model, 'emailVerifications', [] );
            Ember.set( model, 'smsVerifications', [] );
        }
    },

    renderTemplate: function( controller, model ){
        this.render( 'registrations.verification', {
            into: 'registrations.view',
            outlet: 'registrationPrimary'
        } );
    },

    actions: {
        reloadVerificationModel: function(){
            return this.refresh();
        }
    }
} );

