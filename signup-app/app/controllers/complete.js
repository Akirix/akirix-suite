import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'signup-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    confirmation: false,
    registrationBinding: 'controllers.application.model',

    accountType: function(){
        var value = null;
        switch( this.get( 'registration.account_type' ) ){
            case 'business':
                value = 'Business';
                break;
            case 'personal':
                value = 'Personal';
                break;
        }

        return value;
    }.property( 'registration.account_type' ),

    documentTypes: function(){
        var documentTypes = this.get( 'model' );
        var registration = this.get( 'registration' );
        var documents = this.get( 'registration.documents' ).filterBy( 'status', 1 );
        var accountType = registration.get( 'account_type' );

        if( registration.get( 'company.country' ) === 'US' || registration.get( 'company.country' ) === 'NZ' ){
            documentTypes = documentTypes.rejectBy( 'name', 'w8_ben' );
            documentTypes = documentTypes.rejectBy( 'name', 'w8_ben_e' );
        }

        documentTypes.forEach( function( documentType ){
            var currentDocuments = documents.filterBy( 'document_type', documentType.name );
            var exemption = currentDocuments.findBy( 'exemption', true );

            if( Ember.isEmpty( exemption ) ){
                Ember.set( documentType, 'documents', currentDocuments );
            }
            else{
                Ember.set( documentType, 'documents', [ exemption ] );
            }
        } );

        return documentTypes;
    }.property( 'model', 'controllers.application.model.documents' ),

    actions: {
        complete: function(){
            this.set( 'confirmation', true );
        },

        back: function(){
            this.set( 'confirmation', false );
        },

        confirm: function(){
            var _this = this;
            var adapter = _this.get( 'akxAdapter' );
            var registration = _this.get( 'registration' );

            if( !Ember.isEmpty( registration.status ) && registration.status === 0 ){
                _this.set( 'formLocked', true );
                registration.completeStep( 'complete' );
                adapter.sendRequest( '/registrations/' + registration._id + '/appSteps', 'put', { appSteps: registration.appSteps } )
                    .then( function(){
                        return adapter.sendRequest( '/registrations/' + registration._id + '/complete', 'put' );
                    } )
                    .then( function(){
                        registration.set( 'status', 1 );
                        _this.notify.info( {
                            raw: 'An email has been sent to ' + _this.get( 'session.user.email' ),
                            closeAfter: null
                        } );
                        _this.transitionToRoute( registration.get( 'nextStep' ) );
                    } )
                    .catch( function(){
                        _this.notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                    } )
                    .finally( function(){
                        _this.set( 'formLocked', false );
                    } );
            }
            else{
                _this.transitionToRoute( 'complete-final' );
            }
        },

        goBackToStep: function( step ){
            var _this = this;
            var registration = this.get( 'registration' );
            var adapter = _this.get( 'akxAdapter' );

            registration.revokeStep( step );
            adapter.sendRequest( '/registrations/' + registration._id + '/appSteps', 'put', { appSteps: registration.appSteps } )
                .then( function( result ){
                    _this.transitionToRoute( registration.get( 'nextStep' ) );
                } )
                .catch( function(){
                    _this.notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                } );
        }
    }
} );
