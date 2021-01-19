import Ember from 'ember';
import config from 'signup-app/config/environment';

export default Ember.View.extend( {
    templateName: 'views/document-exemption',
    documentTypeBinding: 'controller.documentType',
    documentsBinding: 'controller.documents',
    registrationBinding: 'parentView.controller.model',
    hasExemptionBinding: 'controller.hasExemption',
    checkExemptionBinding: 'controller.checkExemption',
    exemption: function(){
        return this.get( 'documents' ).findBy( 'exemption', true );
    }.property( 'documents' ),

    exemptionWatcher: function(){
        if( this.get( 'documentType.exemptible' ) ){
            if( this.get( 'checkExemption' ) ){
                this.send( 'sendExemption' );
            }
            else{
                this.send( 'removeExemption' );
            }
        }
    }.observes( 'checkExemption' ),

    actions: {
        sendExemption: function(){
            var _this = this;
            var adapter = this.get( 'controller.akxAdapter' );
            var registration = this.get( 'registration' );
            var documentType = this.get( 'documentType' );
            var notify = _this.get( 'controller.notify' );

            var exemption = this.get( 'exemption' );
            var exemptionReason = this.get( 'exemption_reason' );

            if( this.get( 'documentType.exemptible' ) ){
                // If no exemption found
                if( Ember.isEmpty( exemption ) ){
                    exemption = {
                        document_id: null,
                        document_type: documentType.name,
                        exemption: true
                    };

                    // Create one
                    adapter.sendRequest( '/registrations/' + registration._id + '/documents', 'post', exemption ).then( function( response ){
                        Ember.run.schedule( 'sync', _this, function(){
                            registration.documents.pushObject( response.data );
                            registration.notifyPropertyChange( 'documents' );
                            _this.set( 'previousExemptionReason', exemption.exemption_reason );
                        } );
                    }, function( error ){
                        notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                    } );
                }
                else{
                    // Update the current one
                    Ember.set( exemption, 'exemption_reason', exemptionReason );
                    adapter.sendRequest( '/registrations/' + registration._id + '/documents/' + exemption._id, 'put', exemption )
                        .then( function( response ){
                            Ember.run.schedule( 'sync', _this, function(){
                                _this.set( 'previousExemptionReason', response.data.exemption_reason );
                            } );
                        }, function( error ){
                            notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                        } );
                }
            }
        },

        removeExemption: function(){
            var _this = this;
            var adapter = this.get( 'controller.akxAdapter' );
            var registration = this.get( 'registration' );
            var exemptions = this.get( 'documents' ).filterBy( 'exemption', true );
            var notify = _this.get( 'controller.notify' );

            if( this.get( 'documentType.exemptible' ) ){
                if( !Ember.isEmpty( exemptions ) ){
                    exemptions.forEach( function( value ){
                        adapter.sendRequest( '/registrations/' + registration._id + '/documents/' + value._id, 'delete' )
                            .then( function( response ){
                                Ember.run.schedule( 'sync', _this, function(){
                                    registration.documents.removeObject( value );
                                    registration.notifyPropertyChange( 'documents' );
                                } );
                            }, function( error ){
                                notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                            } );
                    } );
                }
            }
        }
    }
} );
