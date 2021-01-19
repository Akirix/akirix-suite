import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'registrations/view', 'application' ],
    registrationBinding: 'controllers.registrations/view.model',

    validations: {
        exemption_reason: {
            presence: true
        },
        document_type: {
            presence: true
        }
    },

    exemptibleDocuments: function(){
        return this.get( 'model.documentTypes' ).filterBy( 'exemptible', true );
    }.property( 'model.documentTypes' ),

    isFile: function(){
        return this.get( 'type' ) === 'file';
    }.property( 'type' ),

    actions: {
        uploadExemption: function(){
            var _this = this;
            var registration = _this.get( 'registration' );
            var akxUtil = _this.get( 'akxUtil' );

            _this.validate().then( function(){
                var exemption = {
                    exemption: true,
                    exemption_reason: _this.get( 'exemption_reason' ),
                    document_type: _this.get( 'document_type' )
                };

                akxUtil._sendRequest( '/signupRegistrations/' + registration._id + '/createDocument', 'post', exemption ).then( function( result ){
                    _this.send( 'reloadRegistrationModel' );
                }, function(){
                } );

            }, function( errors ){
            } );
        }
    }
} );

