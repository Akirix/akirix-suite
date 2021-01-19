import Ember from 'ember';
import config from 'signup-app/config/environment';
import defaultVerificationController from 'signup-app/controllers/verification/default';

export default defaultVerificationController.extend( {
    queryParams: [ 'documentTypeName', 'uid' ],

    actions: {
        nextStep: function(){
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
            else {
                Ember.Logger.log( 'Step not complete' );
            }
        }
    }
} );
