import Ember from 'ember';
import config from 'signup-app/config/environment';
import defaultVerificationController from 'signup-app/controllers/verification/default';

export default defaultVerificationController.extend( {
    documentTypeName: 'tax_identity',
    companyBinding: 'controllers.application.content.company',

    stepComplete: function(){
        return this._stepComplete();
    }.property( 'documents', 'company.tax_num', 'company.tax_num_type', 'isValid' ),

    _stepComplete: function(){
        return ( this.get( 'documents' ).length > 0 && this.get( 'isValid' ) ) || this.get( 'hasExemption' );
    },

    init: function(){
        this._super();
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
                        _this.notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                    } );
            }
            else{
                Ember.Logger.log( 'Step not complete' );
            }
        }
    }
} );
