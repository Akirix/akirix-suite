import Ember from 'ember';
import defaultVerificationController from 'signup-app/controllers/verification/default';
import config from 'signup-app/config/environment';

export default defaultVerificationController.extend( {
    documentTypeName: 'corporate_documents',
    companyBinding: 'controllers.application.content.company',

    stepComplete: function(){
        return this._stepComplete();
    }.property( 'documents', 'company.company_number' ),

    _stepComplete: function(){
        return ( this.get( 'documents' ).length > 0 && this.get( 'isValid' ) ) || this.get( 'hasExemption' );
    },

    actions: {
        nextStep: function(){
            Ember.Logger.log( 'corporate-documents nextStep' );
            var _this = this;
            var adapter = _this.get( 'akxAdapter' );
            var registration = _this.get( 'registration' );
            var verificationController = this.get( 'controllers.verification' );

            if( _this.get( 'stepComplete' ) ){
                adapter.sendRequest( '/registrations/' + registration._id, 'put', { registration: registration } )
                    .then( function( result ){
                        verificationController.send( 'nextStep' );
                    } )
                    .catch( function(){
                        _this.notify.alert( { raw: config.message.update_error, closeAfter: null } );
                    } );
            }
            else{
                Ember.Logger.log( 'Step not complete' );
            }
        }
    }
} );
